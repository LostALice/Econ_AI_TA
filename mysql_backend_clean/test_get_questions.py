# Simple test script to verify that the get_questions method works
from db_connection import DBConnection
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_get_questions():
    """Test the get_questions method with an example file ID"""
    try:
        # Get a sample file ID from the database
        db = DBConnection()
        
        # Get a list of files first
        files = db.get_file_list()
        if not files:
            print("No files found in database. Please upload a file first.")
            return
        
        # Use the first file ID
        file_id = files[0]['fileID']
        print(f"Testing with file ID: {file_id}")
        
        # Try to get questions for this file
        questions, file_name = db.get_questions(file_id)
        
        # Print results
        print(f"File name: {file_name}")
        print(f"Found {len(questions)} questions")
        
        # Print first question if available
        if questions:
            print("\nFirst question details:")
            first_q = questions[0]
            print(f"Question number: {first_q.get('question_no', 'N/A')}")
            print(f"Question text: {first_q.get('question_text', 'N/A')[:100]}...")
        
        db.close()
        print("\nTest completed successfully!")
    except Exception as e:
        print(f"Error during test: {str(e)}")

if __name__ == "__main__":
    test_get_questions()
