import json
from flask import Flask, render_template, request
from op_text import Roberta, LabelConverter
app = Flask(__name__)

modelPath = r'H:\roberta'
model = Roberta(modelPath)

converter = LabelConverter({
	0 : "Very Negative",
	1 : "Negative",
	2 : "Neutral",
	3 : "Positive",
	4 : "Very Positive"
})

@app.route('/sentences', methods=['POST'])
def test():
	results = "N/A"
	if request.method == 'POST':
		sentences = request.json
		if sentences:
			results = model.predict(sentences["sentences"], converter)
	return json.dumps(results)

@app.route('/index')
def index():
	return render_template('index.html')

if __name__ == '__main__':
	app.run(debug = True)