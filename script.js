// Toggle dropdown when clicking headimg2
const headImg2 = document.querySelector(".headimg2");
// const amount = document.querySelector(".amount");
const dropdown = document.querySelector(".dropdown-menu");

headImg2.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent closing immediately
  dropdown.classList.toggle("show");
  
});



// Close dropdown if clicking outside
document.addEventListener("click", function(event) {
  if (!dropdown.contains(event.target) && !headImg2.contains(event.target)) {
    dropdown.classList.remove("show");
  }
});
