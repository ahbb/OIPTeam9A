from flask import Flask, render_template, request

app = Flask(__name__)

# Sample question and code snippets
question = "numbers = [1,5,4,8,9,100,5,78,37,52] \n What would be the output of this code? \n print(numbers[5])"
code_snippets = [
    {
        "ans": "100",
        "correct": True,
    },
    {
        "ans": "1",
        "correct": False,
    },
    {
        "ans": "78",
        "correct": False,
    },
    {
        "ans": "8",
        "correct": False,
    }
]

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        selected_option = int(request.form['option'])
        if code_snippets[selected_option]["correct"]:
            result = "Robot moving"
        else:
            result = "Please try again"
    else:
        result = ""
    
    return render_template('index.html', question=question, snippets=code_snippets, result=result)

if __name__ == '__main__':
    app.run(debug=True)
