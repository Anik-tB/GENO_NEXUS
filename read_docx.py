import zipfile
import xml.etree.ElementTree as ET
import sys

def read_docx(path):
    try:
        with zipfile.ZipFile(path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            text = []
            for p in tree.iterfind('.//w:p', ns):
                p_text = []
                for t in p.iterfind('.//w:t', ns):
                    if t.text:
                        p_text.append(t.text)
                text.append(''.join(p_text))
            return '\n'.join(text)
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    print(read_docx(sys.argv[1]))
