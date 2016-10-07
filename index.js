const express = require('express');
const cron = require('node-cron');
const app = express();
const CronJob = cron.CronJob;

let cronjobs = [];

const api = express.Router();

const jobs = express.Router();
api.use('/jobs', jobs);

jobs.all('/*', (req, res, next) => {
	if(req.params.id) {
		req.params.job = cronjobs[req.params.id];
	}
	next();
});

function jobMapper(job) {
	return {
		schedule: job.cronTime.toJSON(),
		command: job.__command,
		running: job.running,
		nextRun: job.nextDate().toString(),
		lastRun: job.lastDate().toString()
	};
}

jobs.get('/', (req, res) => {
	res.status(200).send({ jobs: cronjobs.map(jobMapper) });
});

jobs.get('/:id', (req, res) => {
	res.status(200).send({ job: jobMapper(req.params.job) });
});

jobs.post('/', (req, res) => {
	try {
		let job = new CronJob();
		let id = cronjobs.push(job) - 1;
		cronjobs[id].start();
		res.status(200).send({ job: jobMapper(cronjobs[id]) });
	} catch (e) {
		res.status(400).send({ message: 'Invalid job specification' });
	}
});

jobs.put('/:id', (req, res) => {
	try {
		req.params.job.stop();

		let job = new CronJob();
		cronjobs[req.params.id] = job;
		job.start();
		res.status(200).send({ job: jobMapper(cronjobs[req.params.id]) });
	} catch (e) {
		res.status(400).send({ message: 'Invalid job specification' });
	}
});

jobs.delete('/', (req, res) => {
	cronjobs.forEach((j) => j.stop());
	cronjobs.length = 0;
	res.status(200).send();
});

jobs.delete('/:id', (req, res) => {
	req.params.job.stop();
	delete cronjobs[req.params.id];
	res.status(200).send();
});

app.use('/api/v1', api);
app.listen(process.env.PORT || 3000);
