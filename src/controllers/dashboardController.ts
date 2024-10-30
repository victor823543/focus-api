import { Request, Response } from "express";
import { Category, ICategory } from "../models/Category.js";
import { Day, IDay } from "../models/Day.js";
import { TokenPayload } from "../models/User.js";
import {
  convertDaysToWeeks,
  createCurrentWeekBarChartData,
  createEmptyWeekCategoryData,
  createWeekCategoryData,
  getWeekImprovement,
  getWeekScoreLeftObject,
} from "../utils/dashboardFunctions.js";
import { toYMD } from "../utils/dateFunctions.js";
import { sendValidResponse } from "../utils/sendResponse.js";
import { getDayTrendChartData } from "../utils/statsFunctions.js";
import { changeIdFromCategories } from "./sessionController.js";
import { DayR, DayTrendChartData } from "./statsController.js";

type DashboardDataResponse = {
  currentWeekBarChartData: CurrentWeekBarChartData;
  weekImprovement: number; // percentage
  weekCategoryData: WeekCategoryData;
  dayTrendChartData: DayTrendChartData;
  weekScoreLeft: WeekScoreLeft;
  isFirstWeek: boolean;
};

export type CurrentWeekBarChartData = Array<{
  weekday: string;
  "Total Score": number;
  "Previous Week": number;
}>;

export type WeekCategoryData = Record<
  string,
  {
    totalScore: number;
    maxScore: number;
  }
>;

export type WeekScoreLeft = {
  recordScore: number;
  toRecord: number;
  toRecordPercentage: number;
  avgScoreToRecord: number;
  averageScore: number;
  toAverage: number;
  toAveragePercentage: number;
  avgScoreToAverage: number;
};

async function getDashboardData(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const { sessionId } = req.params;

  // Calculate start of current week (Monday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfCurrentWeek = new Date(today);

  startOfCurrentWeek.setDate(
    today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1),
  ); // Set to Monday
  startOfCurrentWeek.setHours(0, 0, 0, 0);

  // Calculate start of previous week (last Monday)
  const startOfPreviousWeek = new Date(startOfCurrentWeek);
  startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);

  const endOfToday = new Date(today);
  endOfToday.setHours(0, 0, 0, 0);

  const dayResult: Array<IDay> = await Day.find({
    user: user._id,
    session: sessionId,
  })
    .populate("categories")
    .lean();

  const days: DayR[] = dayResult
    .map((day) => ({
      ...day,
      date: new Date(day.date),
      id: day._id.toString(),
      user: undefined,
      session: undefined,
      categories: changeIdFromCategories(day.categories),
      _id: undefined,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const currentWeekDays = days.filter((day) => {
    const dayDate = new Date(day.date);
    return dayDate >= startOfCurrentWeek && dayDate <= new Date();
  });

  const previousWeekDays = currentWeekDays
    .map((currentDay) => {
      const previousDayDate = new Date(currentDay.date);
      previousDayDate.setDate(previousDayDate.getDate() - 7);
      return days.find((day) => toYMD(day.date) === toYMD(previousDayDate));
    })
    .filter((day): day is DayR => day !== undefined);

  const mostRecentDate =
    currentWeekDays.length > 0
      ? currentWeekDays.reduce((latest, day) => {
          return day.date > latest ? day.date : latest;
        }, new Date(0))
      : new Date();

  const fiveLastDates: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const newDate = new Date(mostRecentDate.getTime());
    newDate.setUTCDate(newDate.getUTCDate() - i);
    fiveLastDates.push(newDate);
  }

  // If days array is empt, return response with empty data
  if (days.length === 0) {
    const categoryResult: Array<ICategory> = await Category.find({
      user: user._id,
      session: sessionId,
    }).lean();

    const response: DashboardDataResponse = {
      currentWeekBarChartData: createCurrentWeekBarChartData([], []),
      weekImprovement: 0,
      weekCategoryData: createEmptyWeekCategoryData(categoryResult),
      dayTrendChartData: getDayTrendChartData([], fiveLastDates, "Latest"),
      weekScoreLeft: {
        recordScore: 0,
        toRecord: 0,
        toRecordPercentage: 0,
        avgScoreToRecord: 0,
        averageScore: 0,
        toAverage: 0,
        toAveragePercentage: 0,
        avgScoreToAverage: 0,
      },
      isFirstWeek: true,
    };
    return sendValidResponse<DashboardDataResponse>(res, 200, response);
  }

  const weeks = convertDaysToWeeks(days);

  const previousWeekAllDays = days.filter((day) => {
    const dayDate = new Date(day.date);
    return dayDate >= startOfPreviousWeek && dayDate < startOfCurrentWeek;
  });

  const currentWeekBarChartData = createCurrentWeekBarChartData(
    currentWeekDays,
    previousWeekAllDays,
  );
  const dayTrendChartData = getDayTrendChartData(days, fiveLastDates, "Latest");
  const weekCategoryData = createWeekCategoryData(currentWeekDays);
  const weekImprovement = getWeekImprovement(currentWeekDays, previousWeekDays);
  const weekScoreLeft = getWeekScoreLeftObject(currentWeekDays, weeks);
  const isFirstWeek = weeks.length === 0;

  const response: DashboardDataResponse = {
    currentWeekBarChartData,
    weekImprovement,
    weekCategoryData,
    dayTrendChartData,
    weekScoreLeft,
    isFirstWeek,
  };

  return sendValidResponse<DashboardDataResponse>(res, 200, response);
}

export default { getDashboardData };
