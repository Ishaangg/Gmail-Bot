function extractEmailData(messageData) {
    let subject = '';
    let from = '';
    let date = '';
    
    if (messageData.payload && messageData.payload.headers) {
      // Find the header with the name "Subject"
      const subjectHeader = messageData.payload.headers.find(
        header => header.name.toLowerCase() === 'subject'
      );
      if (subjectHeader) {
        subject = subjectHeader.value;
      }
      
      // Find the header with the name "From"
      const fromHeader = messageData.payload.headers.find(
        header => header.name.toLowerCase() === 'from'
      );
      if (fromHeader) {
        from = fromHeader.value;
      }
      
      // Find the header with the name "Date"
      const dateHeader = messageData.payload.headers.find(
        header => header.name.toLowerCase() === 'date'
      );
      if (dateHeader) {
        date = dateHeader.value;
      }
    }
    
    const snippet = messageData.snippet || '';
    
    let body = '';
    if (messageData.payload) {
      // Check if there are parts (the email may be multipart)
      if (messageData.payload.parts && messageData.payload.parts.length > 0) {
        // Find a part that is plain text
        const plainPart = messageData.payload.parts.find(
          part => part.mimeType === 'text/plain'
        );
        if (plainPart && plainPart.body && plainPart.body.data) {
          // Decode Base64 URL-encoded string
          body = Buffer.from(plainPart.body.data, 'base64').toString('utf-8');
        }
      } else if (messageData.payload.body && messageData.payload.body.data) {
        // If no parts, use the main body
        body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8');
      }
    }
    
    return { subject, from, date, snippet, body };
  }
  
  module.exports = { extractEmailData };
  