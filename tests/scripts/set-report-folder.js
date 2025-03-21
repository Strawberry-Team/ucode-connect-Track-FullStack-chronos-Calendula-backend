import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const date = toZonedTime(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);

const folderName = `playwright-report/${format(date, 'yyyy-MM-dd_HH-mm-ss')}`;

console.log(folderName);