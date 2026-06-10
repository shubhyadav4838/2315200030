# Stage 1
1. Retrieve the list of notifications for the logged in students
2. Update the status of the specific notification once the user clicks or view it.
3. Mark All as Read, a bulk action to clear the read messages
4. Recieve Real-time updates, listening for incoming notifications without refreshing the page.

### Fetch Notifications
** Endpoint ** `GET /api/v1/notifications`

### Mark Notification as Read
** Endpoint ** `PATCH /api/v1/notifications/:id/read`

### Mark All Notifications as Read
** Endpoint ** `PATCH /api/v1/notifications/read-all`

### Real-time Notifications
** Endpoint ** `GET /api/v1/notifications/stream`

# Stage 2
## Persistent Storage Suggestion
we will choose MongoDB(NoSQL) because if provides schema flexibility and can handle the unstructured nature of notifications.

### Scalability Problems & Solution
**Query Degradation **
Scanning millions of documents to find the specific student's unread notifications will cause problem.
Solution - Create a Compound Index on {studentId:1, isRead:1}. This allows the engine to instantly locate only the unread documents for that specific user

** Unbounded Storage Growth **
Storing notifications for long time will waste the resources.
Solution - Implement a TTL (Time-To-Live) index on the createdAt field, ensuring automatic deletion of old records.

** Fetch Notifications **
db.notifications.find({ studentId: "1042" })
  .sort({ createdAt: -1 })
  .skip(0)
  .limit(20);

  ** Mark Single Notification as Read **
  db.notifications.updateOne(
  { _id: ObjectId("XXXXXXXX") },
  { $set: { isRead: true } }
);

** Mark All as Read for a Student **
db.notifications.updateMany(
  { studentId: "1042", isRead: false },
  { $set: { isRead: true } }
);

# Stage 3


**Query Provided:**
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;

The above given Query is slow and will create the problem, because if there are millions of notifications then it will scan all the documents and find the specific student's unread notifications which will take a lot of time and resources.

** Solution **
create a Compound Index on {studentId:1, isRead:1}. This allows the engine to instantly locate only the unread documents for that specific user

CREATE INDEX idx_student_read_created ON notifications (studentID, isRead, createdAt DESC);

### SQL Query for the Placements in the Last 7 Days
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL 7 DAY;

# Stage 4:
To enhance the application 
1. Implement a Caching Layer with the help of Redis
2. client-side state management $ localStorage
3. Use effective Pagination

