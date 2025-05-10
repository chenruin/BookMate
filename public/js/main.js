document.addEventListener('DOMContentLoaded', function() {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const globalSearch = document.getElementById('global-search');
  const responseContainer = document.getElementById('response-container');
  
  // Function to add a message to the chat
  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
    
    // Check if content is HTML or plain text
    if (typeof content === 'string' && content.trim().startsWith('<') && content.includes('</')) {
      // Handle as HTML content
      messageDiv.innerHTML = content;
    } else {
      if (typeof content === 'string') {
        let formattedContent = content;
    
        // Add a line break before "GoodReads Rating" or "GoodReads Reviews"
        formattedContent = formattedContent.replace(/(GoodReads (Rating|Reviews))/g, '<br>$1');
    
        // Handle bold with new lines before and after
        formattedContent = formattedContent.replace(/\*\*([^*]+?)\*\*/g, '<br><strong>$1</strong><br>');
    
        // Handle single asterisks as line breaks
        formattedContent = formattedContent.replace(/\*/g, '<br>');
    
        messageDiv.innerHTML = formattedContent;
      } else {
        messageDiv.textContent = content;
      }
    }
    
    
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Function to safely set HTML response
  function setHTMLResponse(container, htmlContent) {
    // Set the innerHTML to render the HTML
    container.innerHTML = htmlContent;
  }
  
  // Function to show loading indicator
  function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'bot-message', 'loading-message');
    loadingDiv.innerHTML = 'Wait, I am thinking<span class="loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingDiv;
  }
  
  // Function to send message to API
  async function sendChatMessage(message) {
    const loadingIndicator = showLoading();
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Remove loading indicator
      loadingIndicator.remove();
      
      // Add the response from API, handle HTML if needed
      addMessage(data.response, false);
      
      // If there's a dedicated response container and HTML response
      if (responseContainer && data.htmlResponse) {
        setHTMLResponse(responseContainer, data.htmlResponse);
      }
      
    } catch (error) {
      // Remove loading indicator
      loadingIndicator.remove();
      
      console.error("Error:", error);
      addMessage("Sorry, there was an error connecting to BookMate. Please try again later.", false);
    }
  }
  
  // Function to send search query
  async function sendSearchQuery(query) {
    const loadingIndicator = showLoading();
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Remove loading indicator
      loadingIndicator.remove();
      
      // Add the response from API
      addMessage(data.response, false);
      
      // If there's a dedicated response container and HTML response
      if (responseContainer && data.htmlResponse) {
        setHTMLResponse(responseContainer, data.htmlResponse);
      }
      
    } catch (error) {
      // Remove loading indicator
      loadingIndicator.remove();
      
      console.error("Error:", error);
      addMessage("Sorry, there was an error processing your search. Please try again later.", false);
    }
  }
  
  // Event listener for send button
  sendButton.addEventListener('click', function() {
    const message = userInput.value.trim();
    if (message) {
      addMessage(message, true);
      userInput.value = '';
      sendChatMessage(message);
    }
  });
  
  // Event listener for enter key in input
  userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const message = userInput.value.trim();
      if (message) {
        addMessage(message, true);
        userInput.value = '';
        sendChatMessage(message);
      }
    }
  });
  
  // Event listener for global search input
  globalSearch.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const query = globalSearch.value.trim();
      if (query) {
        addMessage(`Search: ${query}`, true);
        globalSearch.value = '';
        sendSearchQuery(query);
        
        // Scroll to chat section
        document.querySelector('.chat-container').scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
  
  // Handle search form submission if it exists
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get user input
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        const query = searchInput.value.trim();
        if (query) {
          addMessage(`Search: ${query}`, true);
          searchInput.value = '';
          sendSearchQuery(query);
        }
      }
    });
  }
});