fetch("cards.json")
  .then((data) => data.json())
  .then((data) => {
    console.log(data);
  });

var app = new Vue({
  el: "#app",
  data: {
    message: "You loaded this page on " + new Date().toLocaleString(),
    seen: true,
  },
});
