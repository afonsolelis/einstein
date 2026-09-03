# Base das Aulas 05 e 06

Arquivo: `hospital_patients_real_world.csv`

Fonte original: [Hospital Records for Data Cleaning (Medium)](https://www.kaggle.com/datasets/nudratabbas/hospital-records-for-data-cleaning-medium), publicado no Kaggle por Nudrat Abbas.

Licença declarada na fonte: **CC0: Public Domain**.

Esta cópia foi baixada em 23/08/2026 pelo endpoint público de datasets do Kaggle e mantida com o nome original. Ela contém dados sintéticos para fins educacionais; não contém prontuários reais.

## Inventário verificável

- 5.000 registros e 7 colunas.
- Colunas: `PatientID`, `Age`, `Gender`, `Diagnosis`, `AdmissionDate`, `DischargeDate` e `HospitalID`.
- SHA-256 do CSV: `af6c3023e87c1950cb021579521534c3d44fc940953216ca560ca1d7e3eabc8a`.
- SHA-256 do ZIP de origem: `34cee6476aa99915e6af8dbe26958d4fd66098bf3ccb11a608d6c6b9f5f308eb`.

## Problemas presentes na base bruta

- 350 idades ausentes.
- 350 gêneros ausentes, além de valores `Unknown`.
- 350 diagnósticos ausentes.
- 321 diagnósticos escritos integralmente em maiúsculas, duplicando categorias por capitalização.
- 150 registros com alta anterior à admissão.
- Nenhuma linha duplicada e nenhum `PatientID` duplicado na versão fornecida.

Essas contagens são evidências de conferência, não instruções para apagar ou preencher registros automaticamente. A prática da aula preserva a camada bruta, cria indicadores de qualidade e separa correção segura de casos que exigem decisão humana.
