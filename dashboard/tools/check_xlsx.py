import zipfile
import xml.etree.ElementTree as E
from pathlib import Path
p = Path(__file__).with_name('test-export.xlsx')
with zipfile.ZipFile(p) as z:
    assert z.testzip() is None
    for name in z.namelist(): E.fromstring(z.read(name))
    sheet = E.fromstring(z.read('xl/worksheets/sheet1.xml'))
    ns = {'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    assert sheet.find('.//m:c[@r="A2"]/m:is/m:t',ns).text == '9007199254740993'
    assert sheet.find('.//m:c[@r="C2"]/m:v',ns).text == '2.5'
print('PASS: ZIP CRC, all XML files, exact large ID and numeric score')
p.unlink()
