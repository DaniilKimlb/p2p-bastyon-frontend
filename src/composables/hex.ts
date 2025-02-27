export function hexEncode(text: string){
    var ch: string | number = 0;
    var result = "";
    for (var i = 0; i < text.length; i++)
    {
        ch = text.charCodeAt(i);
        if (ch > 0xFF) ch -= 0x350;
        ch = ch.toString(16);
        while (ch.length < 2) ch = "0" + ch;
        result += ch;
    }
    return result;
}
