import { isSameMonth, isSameWeek } from "date-fns";
import { sortObjectByDateKeys } from "./dateFunctions.js";

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
  let categoryDateOverallStats: CategoryDateStats = {};

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

  //   Calculate overall stats
  const statsLength = Object.keys(categoryDateStats).length;
  const overallStatsSize =
    statsLength < 10 ? "small" : statsLength < 70 ? "medium" : "large";

  switch (overallStatsSize) {
    case "small":
      categoryDateOverallStats = categoryDateStats;
      break;
    case "medium":
      const weeks: Record<
        string,
        { totalScore: number; totalCalculatedScore: number; count: number }
      > = {};

      Object.entries(categoryDateStats).forEach(
        ([dateString, { score, calculatedScore }]) => {
          const date = new Date(dateString);
          const weekNumber = `Week ${Math.ceil(
            (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
              (7 * 24 * 60 * 60 * 1000),
          )}`;

          if (!weeks[weekNumber]) {
            weeks[weekNumber] = {
              totalScore: 0,
              totalCalculatedScore: 0,
              count: 0,
            };
          }

          weeks[weekNumber].totalScore += score;
          weeks[weekNumber].totalCalculatedScore += calculatedScore;
          weeks[weekNumber].count++;
        },
      );

      categoryDateOverallStats = Object.fromEntries(
        Object.entries(weeks)
          .sort(([weekA], [weekB]) => {
            const weekNumberA = parseInt(weekA.split(" ")[1], 10);
            const weekNumberB = parseInt(weekB.split(" ")[1], 10);
            return weekNumberA - weekNumberB;
          })
          .map(([week, { totalScore, totalCalculatedScore, count }]) => [
            week,
            {
              score: totalScore / count,
              calculatedScore: totalCalculatedScore / count,
            },
          ]),
      );
      break;
    case "large":
      const months: Record<
        string,
        { totalScore: number; totalCalculatedScore: number; count: number }
      > = {};

      Object.entries(categoryDateStats).forEach(
        ([dateString, { score, calculatedScore }]) => {
          const date = new Date(dateString);
          const monthKey = date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });

          if (!months[monthKey]) {
            months[monthKey] = {
              totalScore: 0,
              totalCalculatedScore: 0,
              count: 0,
            };
          }

          months[monthKey].totalScore += score;
          months[monthKey].totalCalculatedScore += calculatedScore;
          months[monthKey].count++;
        },
      );

      categoryDateOverallStats = Object.fromEntries(
        Object.entries(months)
          .sort(([monthA], [monthB]) => {
            const dateA = new Date(monthA);
            const dateB = new Date(monthB);
            return dateA.getTime() - dateB.getTime();
          })
          .map(([month, { totalScore, totalCalculatedScore, count }]) => [
            month,
            {
              score: totalScore / count,
              calculatedScore: totalCalculatedScore / count,
            },
          ]),
      );
  }

  const dateStats: CategoryPeriodDateStats = {
    allTime: categoryDateOverallStats,
    thisWeek: sortObjectByDateKeys(categoryDateWeekStats),
    thisMonth: sortObjectByDateKeys(categoryDateMonthStats),
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
