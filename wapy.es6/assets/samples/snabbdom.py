
def wshandler(e):
    print("wshandler", e.data)
    dom = '''{
    "html": {
        "attributes": {
            "class": "chatbot",
            "id": "shell"
        },
        "children": [
            {
                "attributes": {},
                "children": [
                    "beyondjs"
                ],
                "tag": "h1"
            },
            {
                "attributes": {
                    "id": "chatbox"
                },
                "children": [
                    {
                        "attributes": {
                            "onsubmit": "return false;"
                        },
                        "children": [
                            {
                                "attributes": {
                                    "type": "text"
                                },
                                "children": [],
                                "on": {
                                    "change": "484fa4451cf04a8a84ed495144caea3a"
                                },
                                "tag": "input#0baa657cac924918a26d9245693b2418"
                            },
                            {
                                "attributes": {
                                    "type": "submit"
                                },
                                "children": [],
                                "tag": "input"
                            }
                        ],
                        "on": {
                            "submit": "5472f4f29c1a44079a3344b6f4f9547b"
                        },
                        "tag": "form"
                    }
                ],
                "tag": "div"
            }
        ],
        "tag": "div"
    }
}'''
    e.source.write(dom)


def hformat(html,**kw):
    for key in kw:
        hkey = '${%s}'%key
        html = html.replace(hkey, kw.get(key,hkey) )
    return html

with aio.hide:
    with aio.block:
        aio.start([],{})

    tic = 10

    if 1:

        sock = socket()
        sock.bind( ("localhost",80,) )
        sock.listen()

        client, addr = sock.accept()
        client.addEventListener('message', wshandler)

        print( "ACCEPTED:", client, addr  )

        while tic:
            print('tic',tic)
            if aio_return(client):
                print( "client :", client.read(0) )
                html = hformat('''<html>
<base href="http://localhost:8000/">
<style>
html, body {
  width: 100%;
  height:100%;
  margin: 0;
  padding: 0;
}

body {
    background-color: #DDDDDD;
}
</style>
<body>
<pre>pouet from wapy on ${vaddr}</pre>
<img src="logos/beer.png">
</body>
</html>''', **{
    'vaddr':client.vaddr
})

                html = hformat('''<!DOCTYPE html>
<html lang="en">
<base href="http://localhost:8000/beyondjs/src/">
    <head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>beyondjs</title>
	<link href="static/normalize.css" rel="stylesheet">
	<link href="static/fonts/leaguegothic.css" rel="stylesheet">
	<link href="static/main.css" rel="stylesheet">
    </head>

<script>
window.vaddr = "${vaddr}"
</script>

    <body>
	<div id="background">
	    <video autoplay="" loop="" poster="static/video/poster.jpeg">
		<source src="static/video/space.x.ogv" />
		<source src="static/video/space.x.mp4" />
		<source src="static/video/space.x.webm" />
	    </video>
	</div>
	<div id="overlay">
	</div>
	<div id="container"></div>
	<script src="static/main.js" type="module"></script>
    </body>
</html>''', **{
    'vaddr':client.vaddr
})
                aio_write( client.fileno(), html )

            time.sleep(1)

            tic -= 1


