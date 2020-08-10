function my_alert(msg) {   
    $("#alertModalContent").text(msg);
    $('#alertModal').modal('show');
}

$('#alertModal').on('hidden.bs.modal', function (e) {
    $("#alertModalContent").text("");
})