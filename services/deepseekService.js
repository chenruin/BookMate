const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store conversation history
let conversationHistory = [];

/**
 * Format the AI response with HTML for web display
 * @param {string} text - The raw AI response
 * @returns {string} - The HTML-formatted response
 */
function formatResponseToHtml(text) {
  // Remove asterisks before list numbers to fix formatting
  text = text.replace(/\*\s*(\d+\.)/g, '$1');
  
  // Step 1: Extract parts - try to identify introduction and book list
  let introText = '';
  let bookList = [];
  
  // Split by numbered items
  const parts = text.split(/(\d+\.\s+)/);
  
  if (parts.length > 1) {
    // First part is intro text
    introText = parts[0].trim();
    
    // Combine the numbers with their content
    for (let i = 1; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        bookList.push(parts[i] + parts[i + 1].trim());
      } else if (parts[i]) {
        bookList.push(parts[i]);
      }
    }
  } else {
    // If not in expected format, just use the whole text
    introText = text;
  }

  // Step 2: Format to HTML
  let html = '';
  
  // Format intro paragraph with line breaks and bold text
  if (introText) {
    // Process bold formatting
    let formattedIntro = introText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Process line breaks - each * at beginning of line becomes <br>
    formattedIntro = formattedIntro.replace(/\*/g, '<br>');
    
    // Add line breaks before "Rating:" and "Summary:" and other key phrases
    formattedIntro = formattedIntro
      .replace(/(Rating:)/g, '<br>$1')
      .replace(/(Summary:)/g, '<br>$1')
      .replace(/(Goodreads rating:)/gi, '<br>$1')
      .replace(/(Goodreads review:)/gi, '<br>$1')
      .replace(/(Review:)/gi, '<br>$1');
    
    html += `<p>${formattedIntro}</p>`;
  }
  
  // Format book list if it exists
  if (bookList.length > 0) {
    html += '<ul style="list-style-type: none; padding-left: 0;">'; 
    bookList.forEach(book => {
      // Format each book item
      let formattedBook = book.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Add line breaks before key phrases
      formattedBook = formattedBook
        .replace(/(Rating:)/g, '<br>$1')
        .replace(/(Summary:)/g, '<br>$1')
        .replace(/(Goodreads rating:)/gi, '<br>$1')
        .replace(/(Goodreads review:)/gi, '<br>$1')
        .replace(/(Review:)/gi, '<br>$1');
      
      // Replace remaining asterisks with line breaks
      formattedBook = formattedBook.replace(/\*/g, '<br>');
      
      html += `<li style="margin-bottom: 15px;">${formattedBook}</li>`;
    });
    html += '</ul>';
  }
  
  return html;
}

/**
 * Determine if the user is asking for recommendations or just information
 * @param {string} userMessage - The user's message
 * @returns {boolean} - True if asking for recommendations
 */
function isAskingForRecommendations(userMessage) {
  const message = userMessage.toLowerCase();
  const recommendationKeywords = [
    'recommend', 
    'suggestion', 
    'similar', 
    'like', 
    'what should i read', 
    'what books', 
    'suggest',
    'books like',
    'more books',
    'other books'
  ];
  
  return recommendationKeywords.some(keyword => message.includes(keyword));
}

/**
 * Get a response from Gemini AI with conversation context
 * @param {string} userMessage - The user's message
 * @returns {Promise<string>} - The AI's response with HTML formatting
 */
async function getBookRecommendation(userMessage) {
  try {
    // Add the user message to conversation history
    conversationHistory.push({ role: "user", message: userMessage });
    
    // Check if user is asking for recommendations or just information
    const wantsRecommendations = isAskingForRecommendations(userMessage);
    
    // Create the prompt with system instruction
    let prompt = `You are BookMate, a helpful assistant for literacy review or recommendations or both.
    
    IMPORTANT INSTRUCTION: Only provide book recommendations if the user explicitly asks for them.
    
    FORMATTING INSTRUCTIONS:
    ${wantsRecommendations ? 
      `Start with a brief introduction addressing the user's question
      Format book titles in bold using ** on both sides
      Number each book recommendation (1., 2., 3., etc.)
      Do not recommend more than 3 books
      Provide Goodreads ratings and reviews along with the recommendation
      Include a summary for each book` : 
      `Provide a detailed review of the specific book(s) mentioned by the user
      Format the book title in bold using ** on both sides
      Include information about the author, themes, critical reception, and literary significance
      If relevant, mention Goodreads ratings and notable reviews`
    }
    
    Always use * to indicate a new line for rating and review information
    Keep the reply concise and well-formatted
    
    RECENT CONVERSATION HISTORY:`;
    
    // Add conversation history to the prompt (limited to last 5 exchanges to avoid token limits)
    const recentHistory = conversationHistory.slice(-5);
    for (const entry of recentHistory) {
      prompt += `\n${entry.role}: ${entry.message}`;
    }
    
    // Add the current user query
    prompt += `\n\nRespond to the latest user message while considering the full conversation context.
    
    REMEMBER: ${wantsRecommendations ? 
      "The user IS asking for book recommendations, so provide them." : 
      "The user is NOT asking for book recommendations, so DO NOT provide any book recommendations. Only provide information about the specific book(s) they mentioned."
    }`;
    
    // For Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Generate content with conversation context
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();
    
    // Add the AI response to conversation history
    conversationHistory.push({ role: "assistant", message: responseText });
    
    // Format the response with HTML for web display
    const htmlResponse = formatResponseToHtml(responseText);
    
    return htmlResponse;
  } catch (error) {
    console.error('Error with Gemini AI:', error);
    
    // If error happens, try the original approach as fallback
    try {
      console.log('Trying fallback method...');
      
      // Check if user is asking for recommendations
      const wantsRecommendations = isAskingForRecommendations(userMessage);
      
      // Create the prompt with just the current user message
      const fallbackPrompt = `You are BookMate, a helpful assistant for literacy review or recommendations or both.
      
      IMPORTANT INSTRUCTION: ${wantsRecommendations ? 
        "The user IS asking for book recommendations, so provide them." : 
        "The user is NOT asking for book recommendations. DO NOT provide any book recommendations. Only provide information about the specific book(s) they mentioned."
      }
      
      FORMATTING INSTRUCTIONS:
      ${wantsRecommendations ? 
        `Start with a brief introduction addressing the user's question
        Format book titles in bold using ** on both sides
        Number each book recommendation (1., 2., 3., etc.)
        Do not recommend more than 3 books
        Provide Goodreads ratings and review contents along with the recommendation
        Include a summary for each book
        Use * to indicate a new line for rating and review information` : 
        `Provide a detailed review of the specific book(s) mentioned by the user
        Format the book title in bold using ** on both sides
        Include information about the author, themes, critical reception, and literary significance
        If relevant, mention Goodreads ratings and notable reviews
        Use * to indicate a new line between different aspects of the review`
      }
      
      User query: ${userMessage}`;
      
      // Use the original working implementation
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(fallbackPrompt);
      const response = result.response;
      
      // Format the response with HTML for web display
      const htmlResponse = formatResponseToHtml(response.text());
      
      return htmlResponse;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Failed to get book recommendation');
    }
  }
}

/**
 * Reset the conversation history
 */
function resetConversation() {
  conversationHistory = [];
  return { success: true, message: "Conversation has been reset" };
}

/**
 * Get the current conversation history
 * @returns {Array} - The conversation history
 */
function getConversationHistory() {
  return conversationHistory;
}

module.exports = {
  getBookRecommendation,
  resetConversation,
  getConversationHistory
};