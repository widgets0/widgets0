(function() {
    // Скрипт сам забирает "id" из ссылки (в данном случае "vtb-tours")
    const urlParams = new URLSearchParams(document.currentScript.src.split('?')[1]);
    const widgetId = urlParams.get('id'); 

    const frame = document.createElement('iframe');
    // Он сам подставляет папку клиента в путь!
    frame.src = 'https://widgets0.github.io/widgets0/' + widgetId + '/index.html'; 
    
    frame.style = "position: fixed; bottom: 20px; right: 20px; z-index: 999999; width: 380px; height: 620px; border: none; overflow: hidden;";
    frame.setAttribute('scrolling', 'no');
    document.body.appendChild(frame);
})();
