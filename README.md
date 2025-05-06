# Linear Programming Model for Optimal College Choice Based on GPA

## Introduction

This document outlines a Linear Programming (LP) model designed to help students make strategic college application decisions based on their GPA. Using data analysis of past admission statistics, this model balances admission probability with college prestige to optimize application strategy.

## Step 1: Understanding the Data

From our analysis of the college admission dataset, we discovered:

- **College Rankings**: Four tiers of colleges (ranks 1-4, with 1 being most prestigious)
- **Admission Rates by Rank**:
  - Rank 1: 54.1% admission rate
  - Rank 2: 35.8% admission rate
  - Rank 3: 23.1% admission rate
  - Rank 4: 17.9% admission rate
- **GPA Thresholds** (approximate minimum GPA for likely admission):
  - Rank 1: 3.44 GPA
  - Rank 2: 3.38 GPA
  - Rank 3: 3.47 GPA
  - Rank 4: 3.37 GPA

## Step 2: Building the Linear Programming Model

### Mathematical Formulation

Let's define our decision variables:
- $x_i$ = Binary decision variable (1 if apply to college rank i, 0 otherwise)

Our objective function maximizes expected utility:
- $\text{Maximize } \sum_{i=1}^{4} x_i \cdot (w_1 \cdot P_i + w_2 \cdot S_i)$

Where:
- $P_i$ = Probability of admission to college rank i (based on student's GPA)
- $S_i$ = Prestige score of college rank i (1.0, 0.75, 0.5, 0.25)
- $w_1, w_2$ = Weights for admission probability and prestige (default: 0.7, 0.3)

Constraints:
- $\sum_{i=1}^{4} x_i \leq 3$ (Apply to at most 3 colleges)
- $x_i \in \{0,1\}$ (Binary decision variables)

### Calculating Admission Probabilities

For each college rank, we calculate admission probability based on:
1. The student's GPA relative to the college's threshold
2. The mean and standard deviation of admitted students' GPAs
3. The base admission rate for the college

We use a simplified logistic approximation:
- If GPA ≥ threshold: $P_i = \text{admission rate} \cdot (1 + 0.1 \cdot z\text{-score})$
- If GPA < threshold: $P_i = \text{admission rate} \cdot (1 - \text{deficit})$

Where z-score = (student_GPA - mean_admitted_GPA) / std_admitted_GPA

## Step 3: Solving the LP Model

The solution process:
1. Set up the PuLP model with objective function and constraints
2. Solve using the CBC solver
3. Extract selected colleges and their metrics
4. Sort results by utility value

## Step 4: Analyzing the Results

For example, a student with GPA 3.7 might get these recommendations:

| Rank | College Name | Admission Probability | Prestige Score | Utility |
|------|--------------|----------------------|----------------|---------|
| 1 | Top Tier University | 65.3% | 1.0 | 0.756 |
| 2 | High Tier University | 48.2% | 0.75 | 0.562 |
| 3 | Mid Tier University | 36.7% | 0.5 | 0.407 |

The model has determined that applying to these three colleges maximizes the student's weighted utility.

## Step 5: Customizing the Model

Students can customize the model based on their preferences:

### Risk Aversion vs. Prestige Focus

Adjusting weights changes the strategy:
- **Risk-Averse** (w1=0.9, w2=0.1): Prioritizes colleges with higher admission chances
- **Balanced** (w1=0.7, w2=0.3): Default setting balancing admission and prestige
- **Prestige-Focused** (w1=0.3, w2=0.7): Willing to take risks for more prestigious colleges

### Visual Comparison of Strategies

Below is a visual representation of how different weighting strategies might affect college choices for a student with GPA 3.5:

```
Risk-Averse Strategy (90% admission, 10% prestige):
- High Tier University (Rank 2)
- Mid Tier University (Rank 3)
- Regular University (Rank 4)

Balanced Strategy (70% admission, 30% prestige):
- Top Tier University (Rank 1)
- High Tier University (Rank 2)
- Mid Tier University (Rank 3)

Prestige-Focused Strategy (30% admission, 70% prestige):
- Top Tier University (Rank 1)
- High Tier University (Rank 2)
- Mid Tier University (Rank 3)
```

## Step 6: Implementation Walkthrough

1. **Input your GPA**: The model starts by taking your current GPA
2. **Set your preferences**: Decide if you're risk-averse or prestige-focused
3. **Run the model**: The LP solver determines the optimal college choices
4. **Review results**: Examine the recommended colleges and their metrics
5. **Make informed decisions**: Use the results to guide your application strategy

## Conclusion

This Linear Programming model provides a data-driven approach to college application strategy. By balancing admission probabilities with college prestige, it helps students make optimal choices based on their academic profile and preferences.

The model can be further enhanced by incorporating additional factors such as financial considerations, geographic preferences, or specific program strengths at different institutions.


## Disclaimer

**This tool is for educational and demonstration purposes only.**
- The model uses simplified logic and historical data to estimate admission probabilities and optimal strategies.
- Actual college admissions decisions depend on many factors not captured here (e.g., essays, extracurriculars, recommendations, holistic review, changing policies, etc.).

