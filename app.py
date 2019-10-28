import json
from flask import Flask, render_template, request
from flask_cors import CORS
from op_text import DistilBert, LabelConverter
app = Flask(__name__)
CORS(app)

modelPath = r'C:\Users\Dean\Downloads\distilbert5labels'
model = DistilBert(modelPath)

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

if __name__ == '__main__':
	app.run(debug = True)