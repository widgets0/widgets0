(function() {
    const frame = document.createElement('iframe');
    // Сюда ты вставляешь ссылку на страницу конкретного клиента
    frame.src = 'https://widgets0.github.io/widgets0/'; 
    frame.style = "position: fixed; bottom: 20px; right: 20px; z-index: 999999; width: 380px; height: 620px; border: none; overflow: hidden;";
    frame.setAttribute('scrolling', 'no');
    document.body.appendChild(frame);
})();
