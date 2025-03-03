import os
from dotenv import load_dotenv
from langchain_community.utilities import SQLDatabase
from langchain_community.chat_models import ChatOpenAI
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain.agents import initialize_agent, AgentType
from langchain.memory import ConversationBufferMemory
from langchain.schema import AIMessage  # Import the AIMessage class

# Load environment variables (ensure OPENAI_API_KEY is set in your .env file)
load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

# Connect to the AWS RDS PostgreSQL database
# db = SQLDatabase.from_uri(
#     "postgresql://postgres:AIBazMJPQ5hxxjdO23dj@database-1.cvqo884uac74.us-east-1.rds.amazonaws.com:5432/emails_db"
# )

db = SQLDatabase.from_uri("sqlite:///emails.db")


# db = SQLDatabase.from_uri(
#     "postgresql://postgres:AIBazMJPQ5hxxjdO23dj@database-1.cvqo884uac74.us-east-1.rds.amazonaws.com:5432/postgres"
# )

# Initialize the chat model
llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0, openai_api_key=openai_api_key)

# Create a SQLDatabaseToolkit instance which provides tools for SQL operations
toolkit = SQLDatabaseToolkit(db=db, llm=llm)

# Setup conversation memory so the agent can maintain context.
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# Initialize the conversational agent with the tools from the SQL toolkit.
agent = initialize_agent(
    tools=toolkit.get_tools(),
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    memory=memory,
    verbose=True
)

# Start a conversational loop.
print("Type 'exit' to quit.")
while True:
    user_input = input("You: ")
    if user_input.lower() == "exit":
        break
    response = agent.invoke(user_input)  # Using .invoke() as recommended

    # Filter the conversation memory to get only AIMessage instances.
    ai_messages = [msg for msg in memory.chat_memory.messages if isinstance(msg, AIMessage)]
    
    # Print the latest AIMessage content if available.
    if ai_messages:
        print("Agent:", ai_messages[-1].content)


# import os
# import re
# import redis
# import json
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_community.vectorstores import FAISS
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain_openai import ChatOpenAI
# from langchain.chains import ConversationalRetrievalChain
# from langchain.memory import ConversationBufferMemory
# from dotenv import load_dotenv

# load_dotenv()
# openai_api_key = os.getenv("OPENAI_API_KEY")
# if not openai_api_key:
#     raise ValueError("Please set your OPENAI_API_KEY environment variable.")

# # Connect to Redis (adjust host, port, and db if needed)
# redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# def fetch_full_emails_from_redis():
#     """
#     Fetch all email data from Redis.
#     Each email is stored as a hash under keys like "email:<messageId>".
#     This function returns the full dictionary for each email.
#     """
#     pattern = "email:*"
#     keys = redis_client.keys(pattern)
#     emails = []
#     for key in keys:
#         data = redis_client.hgetall(key)
#         emails.append(data)
#     return emails

# def clean_email_text(text: str) -> str:
#     r"""
#     Clean the given email text by:
#       - Removing newline and carriage return characters.
#       - Removing unique code elements that start with '\u' followed by alphanumeric characters.
#       - Collapsing multiple spaces into a single space.
#     """
#     # Replace newline and carriage return with a space.
#     text = text.replace('\n', ' ').replace('\r', ' ')
#     # Remove any sequence starting with "\u" followed by one or more word characters.
#     text = re.sub(r'\\u\w+', '', text)
#     # Remove extra spaces.
#     text = re.sub(r'\s+', ' ', text)
#     return text.strip()

# # Fetch emails from Redis
# full_emails = fetch_full_emails_from_redis()
# # Uncomment for debugging if needed:
# # for email in full_emails:
# #     print(json.dumps(email, indent=2))
# # print(f"Fetched {len(full_emails)} emails from Redis.")

# # Split emails into chunks using LangChain's text splitter.
# text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
# chunks = []
# for email in full_emails:
#     # Convert the email dictionary into a single string by joining its values.
#     email_text = "\n".join([str(value) for value in email.values()])
#     # Debug prints commented out:
#     # print("\n--- Original Email Text ---")
#     # print(email_text)
    
#     # Clean the email text.
#     cleaned_text = clean_email_text(email_text)
#     # Debug prints commented out:
#     # print("--- Cleaned Email Text ---")
#     # print(cleaned_text)
    
#     # Split the cleaned text into chunks.
#     email_chunks = text_splitter.split_text(cleaned_text)
#     # Debug prints commented out:
#     # print("--- Text Chunks ---")
#     # for chunk in email_chunks:
#     #     print(chunk)
#     chunks.extend(email_chunks)

# # Debug print commented out:
# # print(f"Total text chunks created: {len(chunks)}")

# # Generate embeddings using the updated HuggingFaceEmbeddings.
# embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# # Create a FAISS vector store from the text chunks.
# index_dir = "faiss_index"
# if not os.path.exists(index_dir):
#     # Create new FAISS index and save it for future use.
#     vectorstore = FAISS.from_texts(chunks, embeddings)
#     vectorstore.save_local(index_dir)
#     # Debug print commented out:
#     # print("Created new FAISS index and saved locally.")
# else:
#     # Load the existing FAISS index from disk.
#     vectorstore = FAISS.load_local(index_dir, embeddings, allow_dangerous_deserialization=True)
#     # Debug print commented out:
#     # print("Loaded existing FAISS index from disk.")

# # Set up a conversational retrieval chain using OpenAI's GPT model.
# llm = ChatOpenAI(model='gpt-4o-mini', temperature=0.75, max_tokens=500, openai_api_key=openai_api_key)
# # Using return_messages=True to ensure chat history is a list, as required by the chain.
# memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
# conv_chain = ConversationalRetrievalChain.from_llm(llm, retriever=vectorstore.as_retriever(), memory=memory)

# def chat_loop():
#     print("Chatbot: Hi, how can I help you with your emails? (Type 'exit' to quit)")
#     while True:
#         user_query = input("You: ")
#         if user_query.lower() in ['exit', 'quit']:
#             print("Chatbot: Goodbye!")
#             break
#         # Use the updated invoke() method instead of run() to avoid deprecation warnings.
#         response = conv_chain.invoke({"question": user_query})
#         print("Chatbot:", response["answer"])

# if __name__ == '__main__':
#     chat_loop()
