import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionItemDto } from './dto/app_session-dto';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../generated/prisma/client';
import { AccessControlService } from '../auth/access-control.service';


@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService, private accessControl: AccessControlService) { }
  async processBatch(sessionDtos: SessionItemDto[], user: User): Promise<number> {
    if (sessionDtos.length === 0) return 0;
    const userId = user.id;
    // 1. Map raw sessions to match database schema identifiers

    const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) throw new NotFoundException('User not found');

    // Maps to capture unique applications incoming from the current request payload batch
    const incomingAppsMap = new Map<string, { id: string; name: string; category: any }>();
    const uniqueNamesFromPayload = new Set<string>();

    const formattedSessions = sessionDtos.map((session) => {
      const appId = `app-${session.appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      if (!incomingAppsMap.has(appId)) {
        incomingAppsMap.set(appId, {
          id: appId,
          name: session.appName,
          category: this.inferCategory(session.appName),
        });
        uniqueNamesFromPayload.add(session.appName);
      }

      return {
        appId: appId,
        userId: userId,
        start: new Date(session.start),
        end: new Date(session.end),
        durationMs: session.durationMs,
        localDate: session.localDate,
      };
    });


    // 2. Query DB to check what Apps ALREADY exist by ID or Unique Name
    const existingAppsInDb = await this.prisma.app.findMany({
      where: {
        OR: [
          { id: { in: Array.from(incomingAppsMap.keys()) } },
          { name: { in: Array.from(uniqueNamesFromPayload) } }
        ]
      },
      select: { id: true, name: true }
    });
    // Create handy Sets of strings for lightning-fast lookup comparisons
    const existingIds = new Set(existingAppsInDb.map(app => app.id));
    const existingNames = new Set(existingAppsInDb.map(app => app.name.toLowerCase()));

    // 3. Filter our array to keep ONLY apps that don't violate ID or Name uniqueness rules
    const appsToInsert = Array.from(incomingAppsMap.values()).filter(app => {
      const isIdDuplicate = existingIds.has(app.id);
      const isNameDuplicate = existingNames.has(app.name.toLowerCase());
      return !isIdDuplicate && !isNameDuplicate;
    });

    // 4. Safe Relational Transaction Execution
    await this.prisma.$transaction(async (tx) => {
      if (appsToInsert.length > 0) {
        // We can safely insert now because we manually stripped constraint-violating duplicates
        await tx.app.createMany({
          data: appsToInsert,
        });
      }


      // Bulk insert all tracking timelines in one query execution
      await tx.appSession.createMany({
        data: formattedSessions,
      });
    });

    return formattedSessions.length;
  }

  private inferCategory(
    name: string
  ): 'Productivity' | 'Entertainment' | 'Utilities' {
    const norm = name.toLowerCase();

    const productivity = [
      // Editors & IDEs
      'code',
      'vscode',
      'visual studio',
      'cursor',
      'webstorm',
      'intellij',
      'pycharm',
      'goland',
      'clion',
      'sublime',
      'atom',
      'notepad++',

      // Development
      'terminal',
      'iterm',
      'warp',
      'xcode',
      'docker',
      'postman',
      'insomnia',
      'github desktop',

      // Browsers
      'chrome',
      'edge',
      'firefox',
      'brave',
      'arc',
      'opera',

      // Communication
      'slack',
      'discord',
      'teams',
      'zoom',
      'meet',
      'skype',

      // Office
      'word',
      'excel',
      'powerpoint',
      'outlook',
      'notion',
      'obsidian',
      'evernote',
      'onenote',
      'figma',
      'canva',
      'trello',
      'jira',
      'asana',
      'clickup',
      'linear'
    ];

    const entertainment = [
      // Music
      'spotify',
      'apple music',
      'music',
      'tidal',

      // Video
      'vlc',
      'netflix',
      'youtube',
      'prime video',
      'disney',
      'plex',
      'jellyfin',
      'kodi',

      // Gaming
      'steam',
      'epic games',
      'battle.net',
      'riot',
      'league of legends',
      'valorant',
      'minecraft',
      'roblox',
      'gog galaxy',

      // Streaming
      'obs',
      'twitch'
    ];

    if (productivity.some(k => norm.includes(k))) {
      return 'Productivity';
    }

    if (entertainment.some(k => norm.includes(k))) {
      return 'Entertainment';
    }

    return 'Utilities';
  }




  async getDashboard(id: string, user: User, targetDate: Date) {
    const userId: string = await this.accessControl.validateUserAccess(user, id);

    return this.getWeeklyLogSessionsData(userId, targetDate);
  }

  async getWeeklyLogSessionsData(userId: string, targetDate: Date) {
    // 1. Calculate the start (Sunday) of the week for the target date
    const currentDayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday...
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const daysOfWeekShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const daysOfWeekFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // 2. Build the 7-day template and collect string keys for querying
    const weeklyPayload = Array.from({ length: 7 }, (_, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);

      // Generate the exact "YYYY-MM-DD" match key matching the client machine's tracking stamp
      const yyyy = dayDate.getFullYear();
      const mm = String(dayDate.getMonth() + 1).padStart(2, '0');
      const dd = String(dayDate.getDate()).padStart(2, '0');
      const dateStampKey = `${yyyy}-${mm}-${dd}`;

      return {
        dateStamp: dateStampKey,
        dayName: daysOfWeekShort[index],
        fullName: daysOfWeekFull[index],
        duration: 0, // Fallback default
        hasData: false,
      };
    });

    // Extract all 7 string keys for a high-performance single query lookup
    const targetDateStamps = weeklyPayload.map(day => day.dateStamp);

    // 3. Query the Database
    const dbLogSessions = await this.prisma.session.findMany({
      where: {
        userId: userId,
        dateStamp: { in: targetDateStamps },
      },
      // Safely fetch relational lists if your UI wants to render upload/log metadata inline
      include: {
      },
    });

    // 4. Merge database records into your clean 7-day matrix template structure
    for (const session of dbLogSessions) {
      const targetDay = weeklyPayload.find(d => d.dateStamp === session.dateStamp);
      if (targetDay) {
        targetDay.duration = session.duration;
        targetDay.hasData = true;
      }
    }

    // 5. Clean up structural metadata fields before giving to the UI
    return weeklyPayload.map(day => ({
      dayName: day.dayName,
      fullName: day.fullName,
      dateStamp: day.dateStamp,
      totalMinutes: Math.round(day.duration / 60), // Assuming duration is stored in seconds
      totalSeconds: day.duration,
      hasActivity: day.hasData,
    }));
  }




  async getWeeklyDashboardData(targetDate: Date, uId: string, user: User) {
    const userId: string = await this.accessControl.validateUserAccess(user, uId);


    const categoryColors = {
      Productivity: 'bg-indigo-500',
      Entertainment: 'bg-amber-500',
      Utilities: 'bg-cyan-500',
    };

    // 1. Establish the anchor boundaries relative to your target timezone day
    const currentDayOfWeek = targetDate.getDay();
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);


    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7); // Exclusive upper bound boundary

    // 2. Fetch all database sessions spanning this exact week window
    const databaseSessions = await this.prisma.appSession.findMany({
      where: {
        userId,
        start: { gte: startOfWeek, lt: endOfWeek },
      },
      include: { app: true },
    });

    // 3. Generate a pristine template array containing exactly 7 elements
    const daysOfWeekShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const daysOfWeekFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Create the weekly boilerplate slots
    const weeklyPayload = Array.from({ length: 7 }, (_, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);

      const localKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;


      // Pre-fill the structural 24h matrix buckets for each day
      const emptyHourly = Array.from({ length: 24 }, (__, hr) => ({
        hour: hr,
        Productivity: 0,
        Entertainment: 0,
        Utilities: 0,
      }));

      return {
        // Unique date string key (e.g., "2026-06-01") to cleanly categorize rows
        dateKey: localKey,
        dayName: daysOfWeekShort[index],
        fullName: daysOfWeekFull[index],
        totalMinutes: 0,
        appsMap: new Map<string, { name: string; category: string; minutes: number }>(),
        apps: [], // Will be parsed later from appsMap
        hourly: emptyHourly,
      };
    });

    // 4. Trace and slice logged sessions into their respective days and hours
    for (const session of databaseSessions) {
      let pointer = session.start.getTime();
      const sessionEnd = session.end.getTime();
      const category = session.app.category;

      while (pointer < sessionEnd) {
        const currentSegment = new Date(pointer);
        //const dateKey = currentSegment.toISOString().split('T')[0];
        const year = currentSegment.getFullYear();
        const month = String(currentSegment.getMonth() + 1).padStart(2, '0');
        const day = String(currentSegment.getDate()).padStart(2, '0');
        const dateKey = session.localDate || `${year}-${month}-${day}`; // Evaluates to local date string
        const hour = currentSegment.getHours();

        // Calculate wall-clock boundary for the next relative hour
        const nextHourWallClock = new Date(pointer);
        nextHourWallClock.setHours(hour + 1, 0, 0, 0);
        const boundaryPoint = Math.min(sessionEnd, nextHourWallClock.getTime());

        const elapsedMinutes = (boundaryPoint - pointer) / 60000;

        // Find the matching template day element in our payload array
        const targetDay = weeklyPayload.find((d) => d.dateKey === dateKey);

        if (targetDay) {
          // Increment the specific hour column element
          targetDay.hourly[hour][category] += elapsedMinutes;

          // Increment unique app aggregates tracking weights
          const existingApp = targetDay.appsMap.get(session.app.name) || {
            name: session.app.name,
            category: category,
            minutes: 0,
          };
          existingApp.minutes += elapsedMinutes;
          targetDay.appsMap.set(session.app.name, existingApp);
        }

        pointer = boundaryPoint;
      }
    }

    // 5. Final pass: Format Map objects back into clean JSON arrays and round decimals
    return weeklyPayload.map((day) => {
      // Convert temporary map collection to sorted array layout
      const formattedApps = Array.from(day.appsMap.values())
        .map((app) => ({
          id: `app-${app.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: app.name,
          category: app.category,
          minutes: Math.round(app.minutes),
          color: categoryColors[app.category] || 'bg-gray-500',
        }))
        .filter((app) => app.minutes > 0)
        .sort((a, b) => b.minutes - a.minutes);

      const roundedHourly = day.hourly.map((h) => ({
        hour: h.hour,
        Productivity: Math.round(h.Productivity),
        Entertainment: Math.round(h.Entertainment),
        Utilities: Math.round(h.Utilities),
      }));

      const totalMinutes = formattedApps.reduce((sum, app) => sum + app.minutes, 0);

      return {
        dayName: day.dayName,
        fullName: day.fullName,
        totalMinutes,
        apps: formattedApps,
        hourly: totalMinutes > 0 ? roundedHourly : [], // Return empty array if no minutes are logged
      };
    });
  }
}
