"use strict"

var meaningchars = 0

window.stdin = ""

// https://github.com/michaelko/simpleterm
// Released under the terms of the WTFPL

function Term(outputSelector, width, height, hand) {
    this.w = width
    this.h = height
    this.outputSelector = outputSelector
    this.y_base = 0
    this.x = 0
    this.y = 0
    this.cursorstate = 0
    this.handler = hand
    this.colors = ["#000", "#e00", "#0e0", "#ee0", "#00e", "#e0e", "#0ee", "#eee"]
    this.def_attr = 7 << 3
    this.cur_att = this.def_attr
    this.buffer = ""
    // See: http://www.mediaevent.de/javascript/Extras-Javascript-Keycodes.html
    this.complete = false

    this.table = {
        8: "\x7f",
        9: "\t",
        13: "\r",
        10: "\n",
        27: "\x1b",
        33: "\x1b[5~",
        34: "\x1b[6~",
        35: "\x1bOF",
        36: "\x1bOH",
        37: "\x1b[D",
        38: "\x1b[A",
        39: "\x1b[C",
        40: "\x1b[B",
        45: "\x1b[2~",
        46: "\x1b[3~",
        112: '\x1bOP',
        113: '\x1bOQ',
        114: '\x1bOR',
        115: '\x1bOS',
        116: '\x1b[15~',
        117: '\x1b[17~',
        118: '\x1b[18~',
        119: '\x1b[19~',
        120: '\x1b[20~',
        121: '\x1b[21~',
        122: '\x1b[23~',
        123: '\x1b[24~',
    }
}
Term.prototype.open = function () {
    var y
    var rows = ['<table class="terminal-table">']
    var elem = document.querySelector(this.outputSelector)

    this.lines = new Array()
    this.newline = new Array()

    for (y = 0; y < this.w; y++)
         this.newline[y] = 32 | (this.def_attr << 16)
    for (y = 0; y < this.h+1; y++)
        this.lines[y] = this.newline.slice()
    for (y = 0; y < this.h; y++)
        rows.push('<tr><td class="term" id="tline' + y + '"></td></tr>')

    this.applyStyles()
    rows.push('</table>')
    elem.innerHTML = rows.join('')
    this.refresh(0, this.h - 1)
    elem.addEventListener('keydown', this.keyDownHandler.bind(this))
    elem.addEventListener('keypress', this.keyPressHandler.bind(this))
    const that = this
    setInterval(function () {
        that.cursor_timer_cb()
    }, 500)
}

Term.prototype.refresh = function (y1, y2) {
    var y, html, c, x, cursor_x, mode, lastmode, ay
    for (y = y1; y <= y2; y++) {
        ay = (y + this.y_base) % this.h
        html = ""
        cursor_x = (y == this.y && this.cursor_state ) ?  this.x : NaN
        lastmode = this.def_attr
        for (x = 0; x < this.w; x++) {
            mode = this.lines[ay][x] >> 16
            c = this.lines[ay][x] & 0xffff
            if(cursor_x == x)
            	html += '<span class="termReverse">'
            if(cursor_x == x-1)
            	html += '</span>'
            if (mode != lastmode) {
                if (lastmode != this.def_attr)
                    html += '</span>'
                if (mode != this.def_attr)
                    html += '<span style="color:' + this.colors[(mode >> 3) & 7] + ';background-color:' + this.colors[mode & 7] + ';">'
            }
            var ttable={
            	32: "&nbsp;",
            	38: "&amp;",
            	60: "&lt;",
            	62: "&gt;",
            }
            html += (ttable[c] || (c<32 ? "&nbsp;" : String.fromCharCode(c)))
            lastmode = mode
        }
        if (lastmode != this.def_attr) {
            html += '</span>'
        }
       	document.getElementById("tline" + y).innerHTML = html
    }
}
Term.prototype.cursor_timer_cb = function () {
    this.cursor_state ^= 1
    this.refresh(this.y, this.y)
}
Term.prototype.show_cursor = function () {
    if (!this.cursor_state) {
        this.cursor_state = 1
        this.refresh(this.y, this.y)
    }
}


function handle_esc(string) {
    // A Escape sequence. Trying to parse it, in case it is not complete abort and safe the bytes in buffer
    // See http://www-user.tu-chemnitz.de/~heha/hs_freeware/terminal/terminal.htm
    // http://www.termsys.demon.co.uk/vtansi.htm
    // TODO. A not supported Esc sequence blocks all output. Fixit.
    this.complete = false
    var complete=false
    var j=1

    if(string[i+1]=='['){
         if(string[i+2] == 'm'){
            this.cur_att = 7 << 3
            complete=true
            j=2
         }

         if(string[i+2] == '0' && string[i+3] == 'm'){
            this.cur_att = 7 << 3
            complete=true
            j=3
         }

         if(string.slice(i+1).match(/^\[[0-9;]*m/)){
            var m=/^\[[0-9;]*m/.exec(string.slice(i+1))
            j=m[0].length
            complete=true
            var numbers=m[0].match(/[0-9]*/g)
            for(var n=0;n<numbers.length;n++){
                var num=parseInt(numbers[n])
                if(isNaN(num))
                    continue
                if(num>29 && num <38){
                    // Foreground
                    this.cur_att &= 7
                    this.cur_att |= (num-30) << 3
                    complete = true
                }
                if(num>39 && num<48){
                    // Background
                    this.cur_att &= 7 << 3
                    this.cur_att |= num-40
                    complete = true
                }
            }
         }

         if(string.slice(i+1).match(/^\[[0-9]+,[0-9]+[Hf]/)){    // goto xy
            var pos= /^\[([0-9]+),([0-9]+)[Hf]/.exec(string.slice(i+1))
            this.x = parseInt(pos[1])
            this.y = parseInt(pos[2])
            complete=true
            j=1+pos[0].length
         }

        if(string.slice(i+1).match(/^\[2J/)){     // clear screen
            for (y = 0; y < this.h+1; y++)
                this.lines[y] = this.newline.slice()
            this.y_base=0
            this.x=this.y=0
            this.refresh(0,this.h-1)
            j=3
            complete=true
         }
         if(string.slice(i+1).match(/^\[0?J/)){     // clear screen from cursor down
            for (x = this.x  ; x < this.w  ; x++)
                this.lines[(this.y + this.y_base)%this.h][x] = 32 | this.def_attr << 16
            for (y = this.y+1; y < this.h+1; y++)
                this.lines[(y + this.y_base)%this.h] = this.newline.slice()
            this.refresh(0,this.h-1)
            j=(/^\[0?J/.exec(string.slice(i+1))).length+1
            complete=true
         }

         if(string.slice(i+1).match(/^\[6n/)){
            j=3
            complete=true
            console.log("???:" + string.fromCharCode(33)+"["+this.x+";"+this.y+"R" )
            //this.handler(string.fromCharCode(33)+"["+this.x+";"+this.y+"R")
         }
    } else if( typeof(string[i+1]) == "string"){
        // There is a charater after esc, but it's not '[', simply ignor the esc.
        this.buffer=string.slice(i+1)
        complete=true
    }
    this.complete = complete
    return j
}


Term.prototype.write = function (string) {
	//alert(string)
	string=this.buffer+string
	this.buffer=""
	write:
	for(var i=0;i<string.length;i++){
		switch(string.charCodeAt(i)){

		    case 10:  // \n
                this.y++
                break

            case 13:  // \r
                this.x = 0
                break

            case 8:  // Backspace
                if (this.x > 0) {
                    this.x--
                }
                break

            case 9: // Vertical Tab
                n = (this.x + 8) & ~7
                if (n <= this.w) {
                    this.x = n
                }
                break

            case 27:   // ^[
                const j = handle_esc(string)

                if(!this.complete){
                    //this.buffer = string.slice(i)
                    console.log('TODO:FIXME:['+string.slice(i)+"]")
                    i+=j
                    break
                } else {
                    i+=j
                }
                break

		    default: // Normal char. Just display.
                this.lines[(this.y + this.y_base)%this.h][this.x++]=string.charCodeAt(i) | this.cur_att << 16
		}

		if(this.x >= this.w){  // End of Line
			this.x=0
			this.y++
		}
		if (this.y >= this.h) {
            this.y_base++
            this.y--
            this.lines[(this.y + this.y_base) % this.h]=this.newline.slice()
            this.refresh(0, this.h-1)
        }
                // -1 because otherwise the cursor in the old position at a higher line might be still visible.
        this.refresh(Math.max(0,this.y-1), this.y)
	}
}

Term.prototype.keyDownHandler = function (event) {
    var key

    key = this.table[event.keyCode]

    if (event.ctrlKey && event.keyCode >= 65 && event.keyCode <= 90) {
        key = String.fromCharCode(event.keyCode - 64)
    }
    if (event.altKey || event.metaKey) {
        key = "\x1b" + key
    }
    if (key) {
        if (event.stopPropagation) event.stopPropagation()
        if (event.preventDefault) event.preventDefault()
        this.show_cursor()
        this.key_rep_state = 1
        var e = { "domEvent" : event }
        this.handler(e, key)
        return false
    } else {
        this.key_rep_state = 0
        return true
    }
}

Term.prototype.keyPressHandler = function (event) {
    if (event.stopPropagation) event.stopPropagation()
    if (event.preventDefault) event.preventDefault()
    if (
        !this.key_rep_state &&
        ( event.charCode != undefined ) &&
        ( event.charCode !=0 ) &&
        !event.altKey && !event.metaKey
    ) {
        this.show_cursor()
        var e = { "domEvent" : event }
        this.handler(e, String.fromCharCode(event.charCode))
        return false
    } else {
        return true
    }
}

Term.prototype.applyStyles = function () {
  if (!Term.stylesApplied) {
    Term.stylesApplied = true
    var css = '.term { font-family: courier,fixed,swiss,monospace,sans-serif; font-size: 14px; color: #f0f0f0; background: #000000; }' +
      '.terminal-table { border-collapse: collapse; }' +
      '.termReverse { color: #000000; background: #00ff00; }'

    var head = document.head || document.getElementsByTagName('head')[0]
    var style = document.createElement('style')

    style.type = 'text/css'

    if (style.styleSheet){
      style.styleSheet.cssText = css
    } else {
      style.appendChild(document.createTextNode(css))
    }

    head.appendChild(style)
  }
}

Term.stylesApplied = false


function ESC(data) {
    return String.fromCharCode(27)+data
}

// Ctrl+L is mandatory ! xterm.js 4.7.0+
function helper(term, e, kc) {
    var x,y

    // xterm4
    if (!term.y) {
        x = 0+term.buffer.active.cursorX
        y = 0+term.buffer.active.cursorY

    // simpleterm
    } else {
        x = 0 + term.x
        y = 0 + term.y
    }
    //
    if (e.domEvent.ctrlKey) {
        console.log('ctrl + '+ kc)
        if (kc == 76) {
            console.log('clear + '+ y)
            var cy = 0 + y
            if ( cy > 0) {
                var cx = 0 + x
                if (cy <= term.rows) {
                    term.write( ESC("[B") )
                    term.write( ESC("[J") )
                    term.write( ESC("[A") )
                }

                term.write( ESC("[A") )
                term.write( ESC("[K") )
                term.write( ESC("[1J"))

                for (var i=1;i<cy;i++) {
                    term.write( ESC("[A") )
                    term.write( ESC("[M") )
                }
                term.write( ESC("[M") )
                if (cx > 0) {
                    term.write( ESC("["+cx+"C") )

                }
            }
            return false
        }
    }
    return true
}


function handlevt(e, vtchar) {
    /*
    const letter =  String.fromCharCode(e.charCode)
    console.log('VT:'+letter)
    if (!!letter && letter.length === 1) {
        vm.script.vt.write(letter)
    }
    */
    if (!e.domEvent)
        return console.log("VT: "+ vtchar)

    const term = vm.script.vt

    function ESC(data) {
        return String.fromCharCode(27)+data
    }

    const keymapping = {
        'ArrowUp' : ESC("[A"),
        'ArrowDown' : ESC("[B"),
        'ArrowRight' : ESC("[C"),
        'ArrowLeft' : ESC("[D"),
        'Home' : ESC("[H"),
        'End' : ESC("[F"),
        'Delete' : ESC("[C" + String.fromCharCode(127)),
    }

    const printable = !e.domEvent.altKey && !e.domEvent.altGraphKey && !e.domEvent.ctrlKey && !e.domEvent.metaKey;
    const kc = e.domEvent.keyCode

    // that helper handle ctrl+L for clearing screen while keeping cursor pos in the line
    if ( !vm.script.vt_helper(vm.script.vt, e, kc) )
        return;

    var key = e.domEvent.key

    if (key.length>1) {
        if ( key in keymapping ) {
            meaningchars++
            window.stdin += keymapping[key]
            return
        } else {
            key = String.fromCharCode(kc)
        }
        console.log('key '+ e.domEvent.key +" => [" + key + ']  was ['  + kc + ']' )
    }

    if (kc <=27) {
        console.log("KBD : "+kc+ " len= "+key.length+" mc="+  meaningchars)
        if (kc==13) {
            if ( meaningchars ==0 ) {
                vm.script.vt.write("\r\n❯❯❯ ")
                return
            }
            meaningchars = 0
        }

    }

    const utf = unescape(encodeURIComponent(key))

    if (utf.substr(0,1) != key.substr(0,1) ) {
        console.log("utf-8:" + utf )
        window.stdin += utf
    } else {
        window.stdin += key
    }

    if (kc!=13)
        meaningchars++

    //local echo
        //term.write(key)
}


export { Term, helper, handlevt }
