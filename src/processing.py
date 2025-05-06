import pandas as pd
import json

# Load the CSV data
df = pd.read_csv('data/College_admission.csv')

summary = {}

for rank in sorted(df['rank'].unique()):
    rank_df = df[df['rank'] == rank]
    admitted = rank_df[rank_df['admit'] == 1]
    admission_rate = len(admitted) / len(rank_df)
    gpa_threshold = admitted['gpa'].min()  # or use mean/percentile as threshold
    gpa_admitted_mean = admitted['gpa'].mean()
    gpa_admitted_std = admitted['gpa'].std()
    summary[rank] = {
        "admission_rate": round(admission_rate, 3),
        "gpa_threshold": round(gpa_threshold, 2),
        "gpa_admitted_mean": round(gpa_admitted_mean, 2),
        "gpa_admitted_std": round(gpa_admitted_std, 2)
    }

with open('data/College_admission.json', 'w') as f:
    json.dump(summary, f, indent=2)

print("Summary statistics saved to data/College_admission.json")