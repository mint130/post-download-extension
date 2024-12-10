chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "downloadImages") {
        const { images, title } = message;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "performDownloads", images, title },
                (response) => {
                    if (response.status === "completed") {
                        sendResponse({ status: "completed" });
                    } else if (response.status === "noImages") {
                        sendResponse({ status: "noImages" });
                    }
                }
            );
        });

        // 메시지 비동기 응답을 보장
        return true;
    }
});
