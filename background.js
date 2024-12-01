chrome.runtime.onInstalled.addListener(() => {
    console.log("installed")
});

chrome.commands.onCommand.addListener((command) => {
    if(command === 'open-chatbot'){
        chrome.action.openPopup();
    }
})

chrome.runtime.onMessage.addListener(async(req, sender, sendResponse) => {
    if(req.action === 'sendReq'){
        console.log("Request received from popup")
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        let pageUrl;
        try{
            pageUrl = tab.url;
        } catch(err){
            pageUrl = 'No URL';
        } finally{
            sendQuery(req.data.query, pageUrl);
        }
    }
    if(req.action === 'displayRes'){
        sendResponse(req.data);
    }
    if(req.action === 'clearHistory'){
        saveConversationHistory([]);
    }
})

function getConversationHistory(){
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('chatHistory', (data) => {
            resolve(data.chatHistory || []);
        })
    })
}

function saveConversationHistory(chatHistory){
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({chatHistory}, () => {
            resolve();
        })
    })
}

function sendQuery(userQuery, pageUrl){
    getConversationHistory().then((chatHistory) => {
        let conversationHistory = '';

        if(chatHistory.length > 0){
            chatHistory.forEach(item => {
                if (item.query) {
                    conversationHistory += `User: ${item.query}\n`;
                }
                if (item.response) {
                    conversationHistory += `Bot: ${item.response}\n`;
                }
            });
        }

        const body = JSON.stringify({userQuery, pageUrl, conversationHistory})

        fetch("https://geminichatbothandler.azurewebsites.net/api/geminiQuery", {
            method: 'POST',
            header: {
                'Content-Type': 'application/json'
            },
            body,
        })
        .then(async(res) => {
            return await res.text();
        })
        .then(data => {
            const updatedChatHistory = [...chatHistory, {query: userQuery}, {response: data}];
            saveConversationHistory(updatedChatHistory);
            console.log(updatedChatHistory)
            chrome.runtime.sendMessage({action: 'displayRes', data});
        })
        .catch(err => {
            console.error(err.message);
        })
    })
}