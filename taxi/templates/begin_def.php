<main>
    <h1>Modals</h1>
    <button onclick="Telegram.WebApp.showAlert('Hello World!');">Launch Alert</button>
    <button onclick="showPopup();">Launch Popup</button>

    <h1>Links</h1>
    <ul>
        <li>
            <a href="javascript:Telegram.WebApp.openTelegramLink('https://t.me/trendingapps');">Open link within Telegram</a>
        </li>
        <li>
            <a href="javascript:Telegram.WebApp.openLink('https://ton.org/');">Open link in external browser</a>
        </li>
        <li>
            <a href="javascript:Telegram.WebApp.openLink('https://telegra.ph/api',{try_instant_view:true});">Open link inside Telegram webview</a>
        </li>
    </ul>

    <h1>Buttons</h1>
    <button onclick="Telegram.WebApp.expand();">Expand Webview</button>
    <button onclick="toggleMainButton();">Toggle Main Button</button>
    <button onclick="UserInfo();">Show user info</button>
</main>
<div id="viewport"></div>
<div id="viewport-params-size"></div>
<div id="viewport-params-expand"></div>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script>
    // Init TWA
    Telegram.WebApp.ready();

    // Event occurs whenever theme settings are changed in the user's Telegram app (including switching to night mode).
    Telegram.WebApp.onEvent('themeChanged', function() {
        document.documentElement.className = Telegram.WebApp.colorScheme;
    });

    // Show main button
    Telegram.WebApp.MainButton.setParams({
        text: 'Main Button'
    });
    Telegram.WebApp.MainButton.onClick(function () {
        Telegram.WebApp.showAlert('Main Button was clicked')
    }); 
    Telegram.WebApp.MainButton.show();

    // Function to call showPopup API
    function showPopup() {
        Telegram.WebApp.showPopup({
            title: 'Title',
            message: 'Some message',
            buttons: [
                {id: 'link', type: 'default', text: 'Open ton.org'},
                {type: 'cancel'},
            ]
        }, function(btn) {
            if (btn === 'link') {
                Telegram.WebApp.openLink('https://ton.org/');
            }
        });
    };

    // Function to toggle main TWA button
    function toggleMainButton() {
        if (Telegram.WebApp.MainButton.isVisible) {
            Telegram.WebApp.MainButton.hide();
        } else {
            Telegram.WebApp.MainButton.show();
        }
    };

    function setViewportData() {
        var sizeEl = document.getElementById('viewport-params-size');
        sizeEl.innerText = 'width: ' + window.innerWidth + ' x ' + 
            'height: ' + Telegram.WebApp.viewportStableHeight;

        var expandEl = document.querySelector('#viewport-params-expand');
        expandEl.innerText = 'Is Expanded: ' + (Telegram.WebApp.isExpanded ? 'true' : 'false');
    }

    Telegram.WebApp.setHeaderColor('secondary_bg_color');

    setViewportData();
    Telegram.WebApp.onEvent('viewportChanged', setViewportData);

    Telegram.WebApp.onEvent('themeChanged', function() {
        document.body.setAttribute('style', '--bg-color:' + Telegram.WebApp.backgroundColor);
    });

    function UserInfo() {
        let user = Telegram.WebApp.initDataUnsafe.user;
        console.log(user);
    }

</script>