var button = document.getElementById('sidebar-button');
var sidebar = document.getElementById('sidebar');

button.addEventListener('click', function (event) {
	if (sidebar.classList.contains('open')) {
		sidebar.classList.remove('open');
	} else {
		sidebar.classList.add('open');
	}
})