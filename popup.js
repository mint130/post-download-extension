const downloadBtn = document.getElementById("download");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.getElementById("progress-container");
const statusText = document.getElementById("status");

downloadBtn.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            files: ["content.js"],
        },
        () => {
            chrome.tabs.sendMessage(tab.id, { action: "getImages" }, (response) => {
                if (response?.images?.length) {
                    const totalImages = response.images.length;
                    let completedCount = 0;

                    // 진행률 바 초기화, 버튼 숨기기
                    downloadBtn.style.display="none";
                    progressContainer.style.display = "block";
                    progressBar.style.width = "0%";
                    statusText.textContent = `다운로드 준비 중... (0/${totalImages})`;

                    chrome.runtime.sendMessage(
                        { action: "downloadImages", images: response.images, title: response.title },
                        (res) => {
                            if (res.status === "completed") {
                                statusText.textContent = "모든 이미지 다운로드 완료!";
                                setTimeout(() => {
                                    progressContainer.style.display = "none"; // 진행률 바 숨기기
                                }, 2000);
                            } else if (res.status === "noImages") {
                                alert("이미지를 찾을 수 없습니다.");
                                progressContainer.style.display = "none"; // 진행률 바 숨기기
                            }
                        }
                    );

                    chrome.runtime.onMessage.addListener((message) => {
                        if (message.action === "updateProgress") {
                            completedCount++;
                            const progress = Math.floor((completedCount / totalImages) * 100);
                            progressBar.style.width = `${progress}%`;
                            statusText.textContent = `다운로드 중... (${completedCount}/${totalImages})`;
                        }
                    });
                } else {
                    alert("이미지를 찾을 수 없습니다.");
                }
            });
        }
    );
});
