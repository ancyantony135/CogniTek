Automation & Scraping Guide for Benil

Your job is to build the scripts that "feed" the database with academic data.

1. Where to Put Your Code
    Do not create a new folder. You will work inside the Backend/ directory. 
    Create a new folder there named automation.

2. Your Mission: The KTU Scraper
    Cognitek needs to know when exams or results are out without the student checking the portal.
    
    Target: The KTU (Kerala Technological University) portal or student login.

    Goal: Scrape "Upcoming Exams" or "Internal Marks" and convert them into Tasks in our shared cognitek.db.

    Integration: You must use the SQLAlchemy models defined in main.py so the data you scrape shows up on Elvin's frontend immediately.

3. Syllabus-to-Flashcards Logic
    Since we are building a student assistant, you need to help the AI (Gemini) create study materials.

    Task: Write a script that takes a PDF (Syllabus) and breaks it into "Topics to Study."

    Output: Send these topics to the api/chat endpoint so Gemini can generate flashcards for the student.

4. Your "Developer Checklist"

    Use Playwright or BeautifulSoup: For scraping, use modern libraries. Add them to the requirements.txt after installing.

    Environment: Work inside the (venv) Erhan created. Run pip install playwright (or your preferred scraper) inside that environment.

    Database Connection: Use the relative path sqlite:///../Database/database/cognitek.db to save the data you scrape. This ensures we all share the same memory.

    Headless Mode: Since this will eventually run on a wearable or a background server, ensure your scraper runs in "headless" mode (no browser window popping up). 


5. How You should Interacts with the my code
    Benil, you don't need my processor for scraping. 
    You can write and test your code on your own laptop. Once your script works:

    Commit your automation/ folder to GitHub.

    I will then "import" your functions into the main.py to trigger them via the API.