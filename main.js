const SPACE = 32;
const BACKSPACE = 8;
const ENTER = 13;
const CTRL = 17;
const VKEY = 86;

const INITCHAR = "\u200B"; 
const INITREG = RegExp(INITCHAR, 'g');
const BORDER_ON = '10px';
const BORDER_OFF = '0px';
const MARGIN_ON = '7px';
const MARGIN_OFF = '0px';

const MAX_TAGS = 128;

var ctrlPressed = false;

function getSentiment(text, callback){
	$.ajax({
		type:"POST",
		dataType: "json",
		data: JSON.stringify({'sentences': [text]}),
		contentType: 'application/json;charset=UTF-8',
		cache:false,
		url: "http://127.0.0.1:5000/sentences",
		success: function(data){
			callback(data);
		},
		error: function(){
			console.log("Error");
		}
	});
}

class TagsInput { 
	constructor(elemName, initText){
		this.setUpElement(elemName);
		this.text(initText);
		this.tags = []
		this.fullStr = "";
	}
	
	limitReached(){
		return this.tags.length >= MAX_TAGS;
	}

	addTag(tag){
		if (this.textNode()){
			this.element.insertBefore(tag.element, this.textNode());
		}else{
			this.element.appendChild(tag.element);
		}
		this.tags.push(tag);
		console.log(this.tags.length);
		this.addToFullStr(tag.text);
		getSentiment(this.fullStr, tag.update.bind(tag));
	}

	addToFullStr(text){
		if (this.fullStr.length > 0){
			this.fullStr += " ";
		}
		this.fullStr += text;
	}

	removeFromFullStr(text){
		this.fullStr = this.fullStr.substring(0, this.fullStr.length - (text.length + 1));
	}
	
	lastChild(){
		return this.tags.length > 0 ? this.tags[this.tags.length-1] : null;
	}

	keyDown(event){
		if(!ctrlPressed){
			switch(event.keyCode){
				case CTRL:
					ctrlPressed = true;
					break;
				case ENTER:
					event.preventDefault();
					break;
				case SPACE:
					event.preventDefault();
					setTimeout(this.handleSpace.bind(this), 1);
					break;
				case BACKSPACE:
					this.handleBackspace();
					break;
				default:
					if (this.limitReached()) event.preventDefault();
					if (this.selected()) this.selected().removeAttribute('data-selected');
			}

			setTimeout(this.updateCursor.bind(this), 1);    

		}
	}

	keyUp(event){
		if (event.keyCode == CTRL){
			ctrlPressed = false;
		}
	}

	focus(){
		this.text(INITCHAR);
		var range = document.createRange();
        range.selectNodeContents(this.element);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
		this.tags.forEach(tag => {tag.focus();});
		this.updateCursor();
	}

	focusLost(){
		this.tags.forEach(tag => { tag.focusLost();});
	}

	onPaste(event){
		var clipboardData, pastedData;

		// Stop data actually being pasted into div
		event.stopPropagation();
		event.preventDefault();

		// Get pasted data via clipboard API
		clipboardData = event.clipboardData || window.clipboardData;
		pastedData = clipboardData.getData('Text');

		if (pastedData.length > 0){
			this.handlePasted(pastedData);
		}
	}

	updateCursor(){
		if (this.blank()){
			this.element.setAttribute('data-cursor', '');
		}else{
			this.element.removeAttribute('data-cursor');
		}
	}

	blank(){
		return this.textNode().data.replace(INITCHAR, '') == '';
	}

	text(v){
		if(!this.textNode()) this.element.appendChild(document.createTextNode(''));
		this.textNode().data = v;
	}

	textNode(){
		return this.element.lastChild instanceof Text ? this.element.lastChild : null;
	}

	selected(){
		return this.element.querySelector("span[data-selected]");
	}

	handlePasted(text){
		if (!this.limitReached()){
			this.handleSpace();
			var words = text.split(' ').filter((el) => {return el.length > 0});
			words.forEach(word => {
				var tag = new Tag(word, this.lastChild());;
				this.addTag(tag);
			});	
		}	
	}

	handleSpace(){
		if (!this.blank()){
			var text = this.textNode();
			var tag = new Tag(text.data, this.lastChild());
			text.data = INITCHAR;
			this.addTag(tag);
		}
	}

	handleBackspace(){
		if (this.blank()){
			event.preventDefault();
			if (this.selected()){
				var tag = this.tags.pop()
				var tagColor  = tag.element.style.backgroundColor;
				this.removeFromFullStr(tag.text);
				var prev = tag.previous;
				this.element.removeChild(tag.element);
				if (prev){
					if (prev.element.style.backgroundColor == tagColor){
						prev.element.style.borderTopRightRadius = BORDER_ON;
						prev.element.style.borderBottomRightRadius = BORDER_ON;
						prev.element.style.marginRight = MARGIN_ON;
					}
				}
			}
			else{
				var last = this.lastChild();
				if (last){
					last.element.setAttribute('data-selected', '');
				}
			}
		}
	}

	setUpElement(elemName){
		this.element = document.querySelector(elemName);
		this.element.addEventListener('keydown', this.keyDown.bind(this));
		this.element.addEventListener('keyup', this.keyUp.bind(this));
		this.element.addEventListener('focus', this.focus.bind(this));
		this.element.addEventListener('paste', this.onPaste.bind(this));
		this.element.addEventListener('focusout', this.focusLost.bind(this));
		this.element.setAttribute('contenteditable', 'true');
	}
}

class Tag{
	constructor(text, previousElem){
		this.createElement(text);
		this.previous = previousElem;
		this.recievedContent = false;
	}

	createElement(text){
		this.text = this.clean(text);
		this.element = document.createElement('span');
		this.element.appendChild(document.createTextNode(this.text));
		this.element.setAttribute('contenteditable', 'false');
	}

	focus(){
		this.element.removeAttribute('focus-lost', '');
	}

	focusLost(){
		this.element.setAttribute('focus-lost', '');
	}

	hover(){
		this.tagInfo.visible(true);
	}

	hoverLost(){
		this.tagInfo.visible(false);
	}

	clean(text){
		return text.replace(INITREG, '');
	}
	
	update(sentimentInfo){
		var converter = {
			0 : "#ff0033",
			1 : "#ff6768",
			2 : "orange",
			3 : "#96d800",
			4 : "green"
		};

		var color = converter[sentimentInfo[0][1]];
		this.element.style.backgroundColor = color;
		this.recievedContent = true;

		var confidenceScores = sentimentInfo[0][0];
		var sentimentLabel = sentimentInfo[0][2];

		this.tagInfo = new TagInfo(color, confidenceScores, sentimentLabel);
		this.element.appendChild(this.tagInfo.element);
		this.element.addEventListener('mouseenter', this.hover.bind(this));
		this.element.addEventListener('mouseleave', this.hoverLost.bind(this));

		if (this.previous){
			this.awaitPrevious(this);
		}
	}

	awaitPrevious(self){
		if (!self.previous.recievedContent){
			setTimeout((() => {self.awaitPrevious(self);}).bind(self), 100);
			return;
		} else {
			if (self.previous.element.style.backgroundColor == self.element.style.backgroundColor){
				self.previous.element.style.borderTopRightRadius = BORDER_OFF;
				self.previous.element.style.borderBottomRightRadius = BORDER_OFF;
				self.previous.element.style.marginRight = MARGIN_OFF;
				self.element.style.borderTopLeftRadius = BORDER_OFF;
				self.element.style.borderBottomLeftRadius = BORDER_OFF;
			}
		}
		

		
	}
}

class TagInfo{
	constructor(bgColor, confidenceScores, textLabel){
		this.createElement(bgColor, confidenceScores, textLabel);
	}

	createElement(bgColor, confidenceScores, textLabel){
		this.element = document.createElement('div');
		confidenceScores.forEach(score => { 
			this.element.appendChild(document.createTextNode("Label: " + score.toString() +"\n"));
		})
		// this.element.appendChild(document.createTextNode(confidenceScores));
		this.element.appendChild(document.createTextNode("Sentiment: " +  textLabel));
		this.element.style.backgroundColor = bgColor;
	}

	visible(isVisible){
		if (isVisible){
			this.element.setAttribute('visible', '');
		}else{
			this.element.removeAttribute('visible');
		}
	}
}

var startText = "Type or Paste"
var input = new TagsInput(".text-area", startText);