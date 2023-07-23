from flask import Flask, render_template, request, session, redirect, url_for

app = Flask(__name__)
app.secret_key = 'your_secret_key' #Just a fun but remember to change this if we ever need to

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

#Hardcoded sample login usernames and passwords

users = {
    "user1": "password1",
    "user2": "password2"
}

@app.route('/', methods=['GET', 'POST'])
def index():
    #if request.method == 'POST':
    #    selected_option = int(request.form['option'])
    #    if code_snippets[selected_option]["correct"]:
    #        result = "Robot moving"
    #    else:
    #        result = "Please try again"
    #else:
    #    result = ""
    
    #return render_template('index.html', question=question, snippets=code_snippets, result=result)

    if 'username' in session:
     # If the user is already logged in, then show the index page.
     result = ""
     return render_template('index.html', question=question, snippets=code_snippets, result=result)
    else:
     #Else if the user is not logged in, redirect to the login page.
     return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        # Check if the provided username and password match the stored credentials.
        if username in users and users[username] == password:
            # Store the username in the session to indicate the user is logged in.
            session['username'] = username
            return redirect(url_for('quiz_selection'))  # Redirect to the quiz_selection page on successful login.
        else:
            return "Invalid username or password. Please try again."

    # If the request is a GET, simply render the login page.
    return render_template('login.html')

@app.route('/logout')
def logout():
    # Remove the 'username' key from the session to log the user out.
    session.pop('username', None)
    return redirect(url_for('index'))

@app.route('/quizSelection')
def quiz_selection():
    return render_template('quiz_selection.html')

if __name__ == '__main__':
    app.run(debug=True)
