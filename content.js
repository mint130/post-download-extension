chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getImages") {
        const title = document.querySelector('.se_publishDate').textContent.replaceAll('.', '').slice(0, 8)
        
        const images = Array.from(document.querySelectorAll(
             '.se_component.se_image.default .se_viewArea img, ' + 
             '.se_component.se_imageStrip.default .se_viewArea img'
        ))
        .map(img => {
            const cleanSrc = img.src.split('?')[0]; // 쿼리 파라미터 제거
            const encodedSrc = encodeURIComponent(cleanSrc);
            const fullUrl = `https://post.naver.com/viewer/image.nhn?src=${encodedSrc}`;
            return fullUrl;
        });

        sendResponse({ title, images });
    }
    
   
    if (request.action === "performDownloads") {
        const { images, title } = request;
        const downloadedUrls = new Set(); // 중복된 URL 추적용
        let completedCount = 0; // 완료된 다운로드 수
        const totalCount = images.length; // 전체 이미지 수
    
        if (totalCount === 0) {
            sendResponse({ status: "noImages" });
            return;
        }
    
        images.forEach((imageUrl, index) => {
            const urlParams = new URL(imageUrl);
            const imgUrl = decodeURIComponent(urlParams.searchParams.get("src"));
    
            if (downloadedUrls.has(imgUrl)) {
                completedCount++;
                if (completedCount === totalCount) {
                    sendResponse({ status: "completed" });
                }
                return; // 중복 다운로드 방지
            }
    
            fetch(imgUrl)
                .then(response => response.blob())
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${title}_${index + 1}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url); // 메모리 해제
                    downloadedUrls.add(imgUrl); // 다운로드한 URL 기록
                })
                .catch(error => console.error('Error downloading image:', error))
                .finally(() => {
                    completedCount++; // 다운로드 완료 수 증가
                    chrome.runtime.sendMessage({ action: "updateProgress" }); // 진행 상황 업데이트
                    if (completedCount === totalCount) {
                        sendResponse({ status: "completed" });
                    }
                });
        });
    
        // 메시지 비동기 응답을 보장
        return true;
    }
    
});