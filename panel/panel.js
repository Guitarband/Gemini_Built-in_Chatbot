let userQuery;
let chatHistory;
let sendButton;
let clearButton;
let copyButton;

function sendQuery(){
    const query = userQuery.value.trim();
    if(query){
        chatHistory.innerHTML += `<div class="userReq">${query}</div>`;
        chrome.runtime.sendMessage({action: 'sendReq', data: {query}});
        userQuery.value = '';
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
}

function loadHistory(conversation){
    chatHistory.innerHTML = '';
    conversation.forEach(item => {
        if(item.query){
            chatHistory.innerHTML += `<div class="userReq">${item.query}</div>`;
        }
        if(item.response){
            chatHistory.innerHTML += `<div class="botRes">${item.response}<button class="copyButton"><i class="far fa-clone"></i></button></div>`;
        }
    })
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function copyToClipboard(event){
    const responseText = event.target.closest('.botRes').innerText;
    navigator.clipboard.writeText(responseText)
}

document.addEventListener('DOMContentLoaded', () => {
    userQuery = document.getElementById('userInput');
    chatHistory = document.getElementById('chatHistory');
    sendButton = document.getElementById('sendButton');
    clearButton = document.getElementById('clearButton');
    copyButtons = document.getElementsByClassName('copyButton');

    chatHistory.addEventListener('click', (e) => {
        if(e.target && e.target.closest('.copyButton')){
            copyToClipboard(e);
        }
    })
    
    userQuery.focus();

    userQuery.addEventListener('keydown', function (e) {
        if(e.key === 'Enter'){
            sendQuery()
        }
    })
    
    sendButton.addEventListener('click', sendQuery);
    
    clearButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({action: 'clearHistory'})
        chatHistory.innerHTML = '';
    });

    chrome.runtime.onMessage.addListener((req) => {
        if (req.action === 'displayRes'){
            chatHistory.innerHTML += `<div class="botRes">${req.data}<button class="copyButton"><i class="far fa-clone"></i></button></div>`;
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    })

    chrome.storage.local.get('chatHistory', (data) => {
        const conversation = data.chatHistory || [];
        loadHistory(conversation);
    })
})