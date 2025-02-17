document.addEventListener("DOMContentLoaded", () => {
    //ヘッダーを読み込む
    fetch("/partials/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-container").innerHTML = data;
        })
        .catch(error => console.error("ヘッダーの読み込みに失敗しました:", error));

     // フッターを読み込む
     fetch("/partials/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer-container").innerHTML = data;
        })
        .catch(error => console.error("フッターの読み込みに失敗:", error));
});