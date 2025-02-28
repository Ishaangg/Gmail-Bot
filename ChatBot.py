import os
import redis
import json
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from dotenv import load_dotenv

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("Please set your OPENAI_API_KEY environment variable.")

# Connect to Redis (adjust host, port, and db if needed)
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def fetch_full_emails_from_redis():
    """
    Fetch all email data from Redis.
    Each email is stored as a hash under keys like "email:<messageId>".
    This function returns the full dictionary for each email.
    """
    pattern = "email:*"
    keys = redis_client.keys(pattern)
    emails = []
    for key in keys:
        data = redis_client.hgetall(key)
        emails.append(data)
    return emails

# Fetch and print full emails
full_emails = fetch_full_emails_from_redis()
for email in full_emails:
    print(json.dumps(email, indent=2))


# 1. Fetch emails from Redis
emails = fetch_full_emails_from_redis()
print(f"Fetched {len(emails)} emails from Redis.")

# 2. Split emails into chunks using LangChain's text splitter
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
chunks = []
for email in emails:
    # Convert the email dictionary into a string by joining its values
    email_text = "\n".join([str(value) for value in email.values()])
    email_chunks = text_splitter.split_text(email_text)
    chunks.extend(email_chunks)

print(f"Total text chunks created: {len(chunks)}")

# 3. Generate embeddings using SentenceTransformer via LangChain
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# 4. Create a FAISS vector store from the text chunks
index_dir = "faiss_index"
if not os.path.exists(index_dir):
    # Create new FAISS index and save it for future use
    vectorstore = FAISS.from_texts(chunks, embeddings)
    vectorstore.save_local(index_dir)
    print("Created new FAISS index and saved locally.")
else:
    # Load the existing FAISS index from disk
    vectorstore = FAISS.load_local(index_dir, embeddings, allow_dangerous_deserialization=True)
    print("Loaded existing FAISS index from disk.")

# 5. Set up a conversational retrieval chain using OpenAI's GPT model
llm = ChatOpenAI(model ='gpt-4o-mini', temperature=0.0, max_tokens=200, openai_api_key=openai_api_key)
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
conv_chain = ConversationalRetrievalChain.from_llm(llm, retriever=vectorstore.as_retriever(), memory=memory)

def chat_loop():
    print("Chatbot: Hi, how can I help you with your emails? (Type 'exit' to quit)")
    while True:
        user_query = input("You: ")
        if user_query.lower() in ['exit', 'quit']:
            print("Chatbot: Goodbye!")
            break
        # Run the conversational chain with the user query
        answer = conv_chain.run(user_query)
        print("Chatbot:", answer)

if __name__ == '__main__':
    chat_loop()
