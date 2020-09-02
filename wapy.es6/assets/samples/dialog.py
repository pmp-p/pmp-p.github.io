from browser import document, window, html, bind

def dialog(draw, remove, callback, validate=None):
    """Generic function to handle a dialog box, similar to Javascript
    built-in "prompt".
    draw and remove are the functions that draw and remove the dialog box.
    draw() returns a 3-element tuple : the <input> tag, the "Ok" and "Cancel"
    buttons.
    If validate is provided, it must be a callable that is applied to the
    input value:
    - if validate(value) doesn't raise a ValueError, the dialog box is removed
    by calling remove(), and callback(value) is called.
    - if it raises a ValueError, the dialog box is reset.
    """
    inp, btn_ok, btn_cancel = draw()

    @bind(btn_ok, "click")
    def click(ev):
        v = inp.value
        try:
            if validate is not None:
                validate(v)
            remove()
            callback(v)
        except ValueError:
            dialog(draw, remove, callback, validate)

    @bind(btn_cancel, "click")
    def cancel(ev):
        remove()

    @bind(inp, "keyup")
    def keyup(ev):
        if ev.keyCode == 13:
            click(ev)

def draw_dialog():
    """Draw the dialog box, with an INPUT field and buttons "Ok" and "Cancel".
    """
    try:
        zone = document["zone"]
        zone.clear()
    except KeyError:
        zone = html.DIV(id="zone")
        document["right"] <= zone
    msg = html.DIV("Enter an integer")
    inp = html.INPUT()
    buttons = html.DIV(style={"text-align": "center"})
    btn_ok = html.BUTTON("Ok")
    btn_cancel = html.BUTTON("Cancel")
    buttons <= btn_ok + btn_cancel
    zone <= msg + inp + html.BR() + buttons

    # center zone in page
    zone.left = int((window.innerWidth - zone.offsetWidth) / 2)
    zone.top = int(window.innerHeight / 10)

    # set focus on the <input> tag
    inp.focus()

    # return the 3-element tuple expected by dialog()
    return inp, btn_ok, btn_cancel

def remove():
    """Remove the dialog box."""
    document["zone"].clear()

def show(value):
    """Called when user entered a valid value."""
    document["zone"].clear()
    document["zone"] <= f"Integer value entered: {value}"

def check_int(value):
    """Try to convert value (a string) into an integer. Raises ValueError
    if value is not an integer literal."""
    int(value)

dialog(draw_dialog,
       remove,
       validate=check_int,
       callback=show)

