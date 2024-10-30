import {
  CategoryDateStats,
  CategoryType,
} from "../controllers/categoryController.js";
import {
  AverageCategoryScore,
  CategoriesInfo,
  DayComparisonInfo,
  DayHorizontalBarChartData,
  DayR,
  DayTrendChartData,
  SessionInfo,
} from "../controllers/statsController.js";
import { CategoryScore } from "../models/Day.js";
import { formatDate, toYMD } from "./dateFunctions.js";
import { to1Dec } from "./functions.js";

export const getCategoryDateObject = (
  category: CategoryType,
  days: DayR[],
): CategoryDateStats => {
  const dateStats = days.reduce<CategoryDateStats>((acc, day) => {
    const scoreObj: CategoryScore | undefined = day.score.find(
      (obj) => obj.category.toString() === category.id,
    );

    // Add the score for this date (or default to 0 if no score exists)
    acc[toYMD(day.date)] = {
      score: scoreObj?.score || 0,
      calculatedScore: scoreObj?.calculatedScore || 0,
    };
    return acc;
  }, {});
  return dateStats;
};

export const getCategoryAverage = (
  dateObj: CategoryDateStats,
): AverageCategoryScore => {
  const scores = Object.values(dateObj);
  const totalScore = scores.reduce((acc, score) => acc + score.score, 0);
  const totalCalculatedScore = scores.reduce(
    (acc, score) => acc + score.calculatedScore,
    0,
  );
  const avgScore = totalScore / scores.length;
  const avgCalculatedScore = totalCalculatedScore / scores.length;
  const avgFraction = avgScore / (scores.length * 10);
  return { avgScore, avgCalculatedScore, avgFraction };
};

export const getDayHorizontalBarChartData = (
  categoriesInfo: CategoriesInfo,
  thisDay: DayR,
  yesterday?: DayR,
  prevWeekDay?: DayR,
): DayHorizontalBarChartData => {
  const data: DayHorizontalBarChartData = Object.values(categoriesInfo).map(
    (info) => {
      const thisDayScore = info.dateStats[toYMD(thisDay.date)]?.score || 0;
      const yesterdayScore = yesterday
        ? info.dateStats[toYMD(yesterday.date)]?.score || 0
        : 0;
      const prevWeekDayScore = prevWeekDay
        ? info.dateStats[toYMD(prevWeekDay.date)]?.score || 0
        : 0;
      const avgScore = info.average.avgScore;
      return {
        category: info.name,
        "This Day": thisDayScore,
        Yesterday: yesterdayScore,
        "Previous Week": prevWeekDayScore,
        Average: avgScore,
      };
    },
  );
  return data;
};

export const getDayComparisonInfo = (
  days: DayR[],
  day?: DayR,
): { dayComparisonInfo?: DayComparisonInfo; sessionInfo: SessionInfo } => {
  // Get the top percentage in which the day falls
  const sortedDays = [...days].sort(
    (a, b) => b.percentageScore - a.percentageScore,
  );

  let dayComparisonInfo: DayComparisonInfo | undefined = undefined;

  if (!!day) {
    const index = sortedDays.findIndex((d) => d.id === day.id);
    const topPercentage = (index / sortedDays.length) * 100;

    // Get shortage or surplus of the day compared to the average
    const avgScore =
      days.reduce((acc, d) => acc + d.totalScore, 0) / days.length;
    const distanceFromAverage = day.totalScore - avgScore;

    // Get the day's rank
    const rank = index + 1;

    // Get the distance from best day
    const bestDay = sortedDays[0];
    const distanceFromBest = day.percentageScore - bestDay.percentageScore;

    // Get the score distance from best day
    const scoreDistanceFromBest = day.totalScore - bestDay.totalScore;

    dayComparisonInfo = {
      topPercentage,
      distanceFromAverage,
      rank,
      distanceFromBest,
      scoreDistanceFromBest,
    };
  }

  const sessionInfo: SessionInfo = {
    bestDay: sortedDays[0],
    worstDay: sortedDays[sortedDays.length - 1],
    totalDays: days.length,
    totalScore: days.reduce((acc, d) => acc + d.totalScore, 0),
  };

  return {
    dayComparisonInfo,
    sessionInfo,
  };
};

export const getDayTrendChartData = (
  days: DayR[],
  dates: Date[],
  latestName: string = "This Day",
): DayTrendChartData => {
  const data: DayTrendChartData = [
    {
      id: "Total Score",
      data: [...dates].reverse().map((date, index) => {
        const day = days.find((d) => toYMD(d.date) === toYMD(date));
        return {
          x:
            index === dates.length - 1 ? latestName : formatDate(date, "clean"),
          y: day ? to1Dec(day.totalScore) : 0,
        };
      }),
    },
  ];
  return data;
};
