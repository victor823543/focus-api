import { Request, Response } from "express";
import { CategoryScore, Day, IDay } from "../models/Day.js";
import { TokenPayload } from "../models/User.js";
import { toYMD } from "../utils/dateFunctions.js";
import { sendValidResponse } from "../utils/sendResponse.js";
import {
  getCategoryAverage,
  getCategoryDateObject,
  getDayComparisonInfo,
  getDayHorizontalBarChartData,
  getDayTrendChartData,
} from "../utils/statsFunctions.js";
import { CategoryDateStats, CategoryType } from "./categoryController.js";
import { changeIdFromCategories } from "./sessionController.js";

type DayStatsResponse = {
  status: "exists" | "not_exists";
  day?: DayR;
  dayComparisonInfo?: DayComparisonInfo;
  dayHorizontalBarChartData?: DayHorizontalBarChartData;
  sessionInfo: SessionInfo;
  dayTrendChartData?: DayTrendChartData;
};

export type DayTrendChartData = Array<{
  id: string;
  data: Array<{
    x: string;
    y: number;
  }>;
}>;

export type CategoriesInfo = Record<
  string,
  {
    id: string;
    name: string;
    dateStats: CategoryDateStats;
    average: AverageCategoryScore;
  }
>;

export type SessionInfo = {
  bestDay: DayR;
  worstDay: DayR;
  totalDays: number;
  totalScore: number;
};

export type DayR = {
  id: string;
  date: Date;
  categories: CategoryType[];
  score: Array<CategoryScore>;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  timestamp: number;
};

export type AverageCategoryScore = {
  avgScore: number;
  avgCalculatedScore: number;
  avgFraction: number;
};

export type DayHorizontalBarChartData = Array<{
  category: string;
  "This Day": number;
  Yesterday: number;
  "Previous Week": number;
  Average: number;
}>;

export type DayComparisonInfo = {
  topPercentage: number;
  distanceFromAverage: number;
  rank: number;
  distanceFromBest: number;
  scoreDistanceFromBest: number;
};

async function getDayStats(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const { sessionId, date: dateString } = req.params;

  const date = new Date(dateString);
  const yesterdayDate = new Date(date);
  yesterdayDate.setDate(date.getDate() - 1);
  const oneWeekAgoDate = new Date(date);
  oneWeekAgoDate.setDate(date.getDate() - 7);
  const fiveLastDates: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - i);
    fiveLastDates.push(newDate);
  }

  const dayResult: Array<IDay> = await Day.find({
    user: user._id,
    session: sessionId,
  })
    .populate("categories")
    .lean();

  const allDays: DayR[] = dayResult.map((day) => ({
    ...day,
    date: new Date(day.date),
    id: day._id.toString(),
    user: undefined,
    session: undefined,
    categories: changeIdFromCategories(day.categories),
    _id: undefined,
  }));

  const day = allDays.find((day) => toYMD(day.date) === dateString);
  const yesterday = allDays.find(
    (day) => toYMD(day.date) === toYMD(yesterdayDate),
  );
  const prevWeekDay = allDays.find(
    (day) => toYMD(day.date) === toYMD(oneWeekAgoDate),
  );

  if (!day) {
    const { sessionInfo } = getDayComparisonInfo(allDays);
    const response: DayStatsResponse = {
      status: "not_exists",
      sessionInfo,
    };
    return sendValidResponse<DayStatsResponse>(res, 200, response);
  }

  const categories: CategoryType[] = day.categories;

  const categoriesInfo: CategoriesInfo = categories.reduce<CategoriesInfo>(
    (acc, category) => {
      const dateStats = getCategoryDateObject(category, allDays);
      acc[category.id] = {
        id: category.id,
        name: category.name,
        dateStats,
        average: getCategoryAverage(dateStats),
      };
      return acc;
    },
    {},
  );

  const dayHorizontalBarChartData = getDayHorizontalBarChartData(
    categoriesInfo,
    day,
    yesterday,
    prevWeekDay,
  );

  const { dayComparisonInfo, sessionInfo } = getDayComparisonInfo(allDays, day);
  const dayTrendChartData: DayTrendChartData = getDayTrendChartData(
    allDays,
    fiveLastDates,
  );

  const response: DayStatsResponse = {
    status: "exists",
    day,
    dayComparisonInfo,
    dayHorizontalBarChartData,
    sessionInfo,
    dayTrendChartData,
  };

  return sendValidResponse<DayStatsResponse>(res, 200, response);
}

export default { getDayStats };
