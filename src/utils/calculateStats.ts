import { isSameMonth, isSameWeek } from "date-fns";

type CategoryDateStats = Record<
  string,
  { score: number; calculatedScore: number }
>;

export type CategoryPeriodDateStats = {
  allTime: CategoryDateStats;
  thisWeek: CategoryDateStats;
  thisMonth: CategoryDateStats;
};

type StatsResult = {
  totalScore: number;
  totalCalculatedScore: number;
  averageScore: number;
  averageCalculatedScore: number;
};

export type CategoryStats = {
  allTime: StatsResult;
  thisWeek: StatsResult;
  thisMonth: StatsResult;
};

type CalculateCategoryStatsReturn = {
  stats: CategoryStats;
  dateStats: CategoryPeriodDateStats;
};

export const calculateCategoryStats = (
  categoryDateStats: CategoryDateStats,
): CalculateCategoryStatsReturn => {
  let totalScoreAllTime = 0;
  let totalCalculatedScoreAllTime = 0;
  let countAllTime = 0;

  let totalScoreThisWeek = 0;
  let totalCalculatedScoreThisWeek = 0;
  let countThisWeek = 0;

  let totalScoreThisMonth = 0;
  let totalCalculatedScoreThisMonth = 0;
  let countThisMonth = 0;

  let categoryDateWeekStats: CategoryDateStats = {};
  let categoryDateMonthStats: CategoryDateStats = {};

  const currentDate = new Date();

  Object.entries(categoryDateStats).forEach(
    ([dateString, { score, calculatedScore }]) => {
      const date = new Date(dateString);
      // All time
      totalScoreAllTime += score;
      totalCalculatedScoreAllTime += calculatedScore;
      countAllTime++;

      // This week
      if (isSameWeek(date, currentDate, { weekStartsOn: 1 })) {
        totalScoreThisWeek += score;
        totalCalculatedScoreThisWeek += calculatedScore;
        categoryDateWeekStats[dateString] = { score, calculatedScore };
        countThisWeek++;
      }

      // This month
      if (isSameMonth(date, currentDate)) {
        totalScoreThisMonth += score;
        totalCalculatedScoreThisMonth += calculatedScore;
        categoryDateMonthStats[dateString] = { score, calculatedScore };
        countThisMonth++;
      }
    },
  );

  // Calculate averages
  const allTime: StatsResult = {
    totalScore: totalScoreAllTime,
    totalCalculatedScore: totalCalculatedScoreAllTime,
    averageScore: countAllTime > 0 ? totalScoreAllTime / countAllTime : 0,
    averageCalculatedScore:
      countAllTime > 0 ? totalCalculatedScoreAllTime / countAllTime : 0,
  };

  const thisWeek: StatsResult = {
    totalScore: totalScoreThisWeek,
    totalCalculatedScore: totalCalculatedScoreThisWeek,
    averageScore: countThisWeek > 0 ? totalScoreThisWeek / countThisWeek : 0,
    averageCalculatedScore:
      countThisWeek > 0 ? totalCalculatedScoreThisWeek / countThisWeek : 0,
  };

  const thisMonth: StatsResult = {
    totalScore: totalScoreThisMonth,
    totalCalculatedScore: totalCalculatedScoreThisMonth,
    averageScore: countThisMonth > 0 ? totalScoreThisMonth / countThisMonth : 0,
    averageCalculatedScore:
      countThisMonth > 0 ? totalCalculatedScoreThisMonth / countThisMonth : 0,
  };

  const dateStats: CategoryPeriodDateStats = {
    allTime: categoryDateStats,
    thisWeek: categoryDateWeekStats,
    thisMonth: categoryDateMonthStats,
  };

  const stats: CategoryStats = {
    allTime,
    thisWeek,
    thisMonth,
  };
  return {
    stats,
    dateStats,
  };
};
