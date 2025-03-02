function logPageText(){
    let mainContent = document.querySelector('article');
    if (!mainContent) {
        mainContent = document.querySelector('main');
    }
    const textToLog = mainContent ? mainContent.innerText : document.body.innerText;

    console.log("Extracted Content:", textToLog);
    
    if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', logPageText);
    } 
    else {
    logPageText();
    }
}