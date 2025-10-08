Excellent question. Enforcing this on your Next.js frontend is crucial for the whole system to work correctly. The key is to ensure that any Date 
  object is converted to a standardized ISO 8601 string before it gets sent to your Python backend.

  Here’s how you can achieve that:

  1. The Golden Rule: Always Use .toISOString()

  The native JavaScript Date object stores time in UTC, but many of its methods return strings in the user's local timezone. To avoid ambiguity, you 
  should always use the .toISOString() method when serializing a date to be sent to the backend.

  This method returns a string in the format YYYY-MM-DDTHH:mm:ss.sssZ, where the Z indicates UTC. Your Pydantic models on the backend will parse this 
  format correctly into a timezone-aware datetime object.

  Example:

  Let's say you're submitting a form.

    1 // WRONG - This sends a complex object that might be serialized
    2 // in a non-standard way, or in the user's local timezone without an offset.
    3 const badPayload = {
    4   name: "My Event",
    5   posted_date: new Date(),
    6 };
    7 // The resulting JSON might be: {"name":"My Event","posted_date":"2025-10-02T10:00:00.000-05:00"}
    8 // or something else entirely, leading to confusion.
    9 
   10 
   11 // RIGHT - This sends a standardized UTC datetime string.
   12 const goodPayload = {
   13   name: "My Event",
   14   posted_date: new Date().toISOString(),
   15 };
   16 // The resulting JSON will be: {"name":"My Event","posted_date":"2025-10-02T15:00:00.000Z"}
   17 // This is unambiguous and universally understood.

  2. Where to Enforce This

  The best place to enforce this is in a centralized API client or wrapper function that your Next.js app uses to communicate with the backend.

  If you have a function that wraps fetch or axios, you can automatically find and convert Date objects in the request body.

  Example of an API wrapper:

    1 // lib/api.js
    2 
    3 // A simple recursive function to find and convert dates in a payload
    4 function convertDatesToISO(body) {
    5   if (body === null || body === undefined) {
    6     return body;
    7   }
    8 
    9   if (body instanceof Date) {
   10     return body.toISOString();
   11   }
   12 
   13   if (typeof body === 'object') {
   14     for (const key in body) {
   15       if (Object.prototype.hasOwnProperty.call(body, key)) {
   16         body[key] = convertDatesToISO(body[key]);
   17       }
   18     }
   19   }
   20   return body;
   21 }
   22 
   23 
   24 export async function postData(url, data) {
   25   const sanitizedData = convertDatesToISO(data); // Automatically convert dates!
   26 
   27   const response = await fetch(url, {
   28     method: 'POST',
   29     headers: {
   30       'Content-Type': 'application/json',
   31     },
   32     body: JSON.stringify(sanitizedData),
   33   });
   34 
   35   if (!response.ok) {
   36     throw new Error('API request failed');
   37   }
   38   return response.json();
   39 }
   40 
   41 // Now, anywhere in your app, you can use postData without
   42 // worrying about converting dates manually.
   43 // await postData('/api/annuity_payouts', { amount: 100, posted_date: new Date() });

  3. Best Practice: Use a Date Library

  While you can manage with the native Date object, it's notoriously difficult to work with, especially when dealing with timezones. I highly recommend 
  using a modern date library like `date-fns` or `Day.js`.

  These libraries make it much easier to:
   * Parse dates from various formats.
   * Display dates to the user in their local time.
   * Format dates for sending to the backend in UTC.

  Example with `date-fns`:

   1 import { formatISO } from 'date-fns';
   2 
   3 // It's explicit and clear what you're doing.
   4 const payload = {
   5   name: "My Event",
   6   posted_date: formatISO(new Date()), // "2025-10-02T15:00:00.000Z"
   7 };

  By adopting these practices on your Next.js frontend, you'll ensure that it communicates seamlessly with your timezone-aware backend, effectively 
  solving the problem at both ends.