function createWordMask(sentence){
    var words = sentence.split(" ")
    var mask = []
    var currentMask = ""
    words.forEach(word => {
        currentMask += word + " ";
        mask.push(currentMask);
    });
    return mask;
}

function getSentiment(sentence){
    var mask = createWordMask(sentence);
    $.ajax({
        type:"POST",
        dataType: "json",
        data: JSON.stringify({'sentences': mask}),
        contentType: 'application/json;charset=UTF-8',
        cache:false,
        url: "http://127.0.0.1:5000/sentences",
        success: function(data){
            console.log(data);
        }
    });
}

getSentiment("After the teacher called the school office for help, Prince-Tinsley was escorted off the campus by the assistant principal, according to prosecutors.");