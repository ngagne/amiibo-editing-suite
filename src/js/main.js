$(function(){
    var selGameChange = function() {
        var id = $('select[name="game"]').val();
        $('section').hide();
        $('#game-' + id).show();

        $('.btn').prop('disabled', id == '');
    };

    $('select[name="game"]').change(selGameChange);
    selGameChange();

    $('form').submit(function(e){
        // disable controls
        $('.alert').removeClass('hide');
        $('.btn').addClass('hide');

        setTimeout(function(){
            $('.alert').addClass('hide');
            $('.btn').removeClass('hide');
        }, 2000);
    });

    var isOffsetInHex = false;
    var pad = function(val) {
        if (String(val).length == 1) {
            return '0' + val;
        }
        return val;
    };
    var updateOffset = function(){
        var index = parseInt($('#hex input:focus').first().attr('data-offset')) || 0;
        $('#hex-offset span').html(isOffsetInHex ? pad(index.toString(16).toUpperCase()) : index);
    };
    var keyDown = function(e) {
        var index = parseInt($(this).attr('data-offset'));
        if (e.keyCode == 38 && index >= 16) {
            $('#hex input').eq(index - 16).focus();
        } else if (e.keyCode == 40 && index <= 523) {
            $('#hex input').eq(index + 16).focus();
        }
    };
    var filterInput = function() {
        var val = $(this).val();
        val = pad(val.toUpperCase().replace(/[^0-9ABCDEF]/g, '').slice(0, 2));
        $(this).val(val);
    };
    $('#hex input').on('focus', updateOffset).on('change', filterInput).on('keydown', keyDown);
    $('#hex-offset').click(function(){
        isOffsetInHex = !isOffsetInHex;
        updateOffset();
    });
    var isSafeToLeave = false;
    $('#btnDecrypted').click(function(){
        $('#hdnType').val('decrypt');
        isSafeToLeave = true;
    });
    $('#btnEncrypted').click(function(){
        $('#hdnType').val('encrypt');
        isSafeToLeave = true;
    });

    updateOffset();

    if ($('#hex').length) {
        window.addEventListener("beforeunload", function (e) {
            if (isSafeToLeave) {
                return true;
            }

            var confirmationMessage = 'Make sure you download your bin data before leaving or refreshing the page.';

            (e || window.event).returnValue = confirmationMessage; //Gecko + IE
            return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
        });
    }
});