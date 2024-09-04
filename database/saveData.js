const pool = require('./dbConfig');

async function savePosts(resultsData) {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE,
                link TEXT
            )`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                author_id INTEGER REFERENCES users(id),
                content TEXT
            )`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS Images (
                id SERIAL PRIMARY KEY,
                post_id INTEGER REFERENCES posts(id),
                imageUrl TEXT
            )`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS com (
                id SERIAL PRIMARY KEY,
                post_id INTEGER REFERENCES posts(id),
                user_id INTEGER REFERENCES users(id),
                content TEXT
            )`);

        await client.query('BEGIN');

        for (let result of resultsData) {
            let userId;
            try {
                const userQuery = `INSERT INTO users (name, link) VALUES ($1,$2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`;
                const userResult = await client.query(userQuery, [result.author,result.authorLink]);
                userId = userResult.rows[0].id;
            } catch (e) {
                console.error('Error inserting/updating user:', e);
                throw e;
            }
            try {
                const postQuery = `INSERT INTO posts (author_id, content) VALUES ($1, $2) RETURNING id`;
                const postResult = await client.query(postQuery, [userId, result.content]);
                const postId = postResult.rows[0].id;

                if (result.imgUrls && result.imgUrls.length > 0) {
                    for (let image of result.imgUrls) {
                        const imageUrlQuery = `INSERT INTO Images (post_id, imageUrl) VALUES ($1, $2)`;
                        await client.query(imageUrlQuery, [postId, image]);
                    }
                }

                if (result.comments && result.comments.length > 0) {
                    for (let comment of result.comments) {
                        try {
                            const commentUserQuery = `INSERT INTO users (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`;
                            const commentUserResult = await client.query(commentUserQuery, [comment.author]);
                            const commentUserId = commentUserResult.rows[0].id;
                            const commentQuery = `INSERT INTO com (post_id, user_id, content) VALUES ($1, $2, $3)`;
                            await client.query(commentQuery, [postId, commentUserId, comment.content]);
                        } catch (e) {
                            console.error('Error inserting comment:', e);
                            throw e;
                        }
                    }
                }
            } catch (e) {
                console.error('Error inserting post:', e);
                throw e;
            }
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

module.exports = { savePosts };
