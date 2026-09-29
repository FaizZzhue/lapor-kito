export interface AnalysisResult {
    overallScore: number;
    problemScore: number;
    solutionScore: number;
    innovationScore: number;
    feasibilityScore: number;
    marketScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}