"""Extract an allowlisted, local snapshot from the provided MariaDB dump."""
import re, json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sql = (root.parent / 'unisalud_PROCRAST_IA.sql').read_text(encoding='utf-8')
tables = {}
for match in re.finditer(r'INSERT INTO `([^`]+)` \((.*?)\) VALUES\s*', sql):
    name, columns = match.group(1), re.findall(r'`([^`]+)`', match.group(2))
    if name not in {'estudiantes', 'planes', 'actividades_plan', 'aplicaciones', 'catalogo_intervenciones'}:
        continue
    rows, row, token, quoted, escaped = [], [], '', False, False
    for ch in sql[match.end():]:
        if quoted:
            if escaped:
                token += {'n':'\n', 'r':'\r', 't':'\t', '0':'\0'}.get(ch, ch)
                escaped = False
            elif ch == '\\': escaped = True
            elif ch == "'": quoted = False
            else: token += ch
        elif ch == "'": quoted = True
        elif ch == '(':
            row, token = [], ''
        elif ch in ',)':
            if ch == ',' and not row and not token.strip(): continue
            value = token.strip()
            row.append(None if value == 'NULL' else value)
            token = ''
            if ch == ')':
                assert len(row) == len(columns), (name, len(row), len(columns))
                rows.append(dict(zip(columns, row)))
                row = []
        elif ch == ';': break
        else: token += ch
    tables.setdefault(name, []).extend(rows)

plans = {p['id']: p for p in tables.get('planes', [])}
catalog = {p['id']: p for p in tables['catalogo_intervenciones']}
activities = []
for a in tables['actividades_plan']:
    p = plans.get(a['plan_id'], {})
    activities.append({**{k:a[k] for k in ['id','plan_id','numero_semana','fecha_programada','estado','minutos_realizados','distractor','observacion','respondido_en','instrucciones']}, 'estudiante_id': p.get('estudiante_id'), 'dimension': catalog[a['intervencion_id']]['dimension']})
data = {'source':'Respaldo SQL · 23 oct 2026', 'students':[{k:s[k] for k in ['id','activo','consentimiento','creado_en']} for s in tables['estudiantes']], 'activities': activities, 'assessments':tables['aplicaciones']}
(root / 'data.js').write_text('window.DASHBOARD_DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')
print({k:len(data[k]) for k in ['students','activities','assessments']})
