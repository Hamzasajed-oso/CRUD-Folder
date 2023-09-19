const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});



// Prompt the user for input
rl.question('Enter a name: ', (name) => {
    // createFile()
    createFoldersAndFiles(name);
    rl.close();
});

function createFoldersAndFiles(name) {

    fs.mkdirSync(name);

    const folderPath = name;

    const folderNames = [
        `get${name}`,
        `delete${name}`,
        `update${name}`,
        `add${name}`,
    ];

    folderNames.forEach((folderName) => {
        const folderPath = `${name}/${folderName}`;

        // Check if the folder already exists
        if (!fs.existsSync(folderPath)) {
            // Create the folder
            fs.mkdirSync(folderPath);
            console.log(`Created folder: ${folderPath}`);
        } else {
            console.log(`Folder ${folderPath} already exists.`);
        }

        // Create files based on folder name
        if (folderName.includes('add')) {
            createFiles(folderPath, `${folderName}.mjs`, generateAddContent(name));
            createFiles(folderPath, `${folderName}.schema.mjs`, generateSchema(name));
        } else if (folderName.includes('get')) {
            createFiles(folderPath, `${folderName}.mjs`, "");
        } else if (folderName.includes('delete')) {
            createFiles(folderPath, `${folderName}.mjs`, generateDeleterContent(name));
        } else if (folderName.includes('update')) {
            createFiles(folderPath, `${folderName}.mjs`, generateUpdateContent(name));
            createFiles(folderPath, `${folderName}.schema.mjs`, generateSchema(name));
        }
    });
}

function createFiles(folderPath, fileName, content) {
    const filePath = `${folderPath}/${fileName}`;

    // Check if the file already exists
    if (!fs.existsSync(filePath)) {
        // Create the file and write the content
        fs.writeFileSync(filePath, content);
        console.log(`Created file: ${filePath}`);
    } else {
        console.log(`File ${filePath} already exists.`);
    }
}

function generateSchema(name) {
    return `export const bodySchema = /** @type {const} */ ({
        type: "object",
        properties: {
            holidayDate: { type: "string" },
            holidayValue: { type: "string" },
        },
        required: [],
        additionalProperties: false,
    })
/** @typedef {import("json-schema-to-ts").FromSchema<typeof bodySchema>} Body */`
}

function generateAddContent(name) {
    const functionName = `add${name}`;
    const method = 'POST';

    return `// @ts-nocheck
import { db } from "#src/core/database/index.mjs"
import { bodySchema } from "./${functionName}.schema.mjs"
import { validateToken } from "#src/core/server/middleware/validateToken.mjs"
import { requestMeta } from "#src/core/helpers/requestMeta.mjs"
import { validateUser } from '#src/app/routes/validateUser.mjs';

/** @type {import("fastify").RouteOptions} */
export const ${functionName} = {
    url: "/broncoLogistics/${name}",
    method: "POST",
    schema: {
        body: bodySchema,
    },
    preValidation: [validateToken],
    handler: async (req) => {

        const body = /** @type {import("./${functionName}.schema.mjs").Body} */ (req.body)
        const { userId } = requestMeta(req)
        await validateUser(userId, true);

        try {

            const dbQuery = await db.holidayModifier.create({
                data: body
            })

            return {
                status: "Success",
                data: dbQuery,
            }

        } catch (error) {
            return {
                status: "Error",
                message: "Failed to add item",
            }
        }

    },
}`
}

function generateDeleterContent(name) {
    const functionName = `delete${name}`;
    const method = 'DELETE';

    return `// @ts-nocheck
    import { db } from "#src/core/database/index.mjs";
    import { validateToken } from "#src/core/server/middleware/index.mjs";
    import { requestMeta } from "#src/core/helpers/requestMeta.mjs";
    import { validateUser } from "#src/app/routes/validateUser.mjs"
    
    /** @type {import("fastify").RouteOptions} */
    export const ${functionName} = {
        url: "/broncoLogistics/${name}/:id",
        method: "${method}",
        preValidation: [validateToken],
        handler: async (req) => {
            const { userId } = requestMeta(req);
            const itemIdToDelete = req.params.id;
            const user = await validateUser(userId, true)
    
            const dbQuery = await db.customerContractRates.findUnique({
                where: {
                    id: itemIdToDelete,
                },
            });
    
            if (!dbQuery) {
                return {
                    status: "Error",
                    message: "Item not found",
                };
            }
    
            await db.customerContractRates.delete({
                where: {
                    id: itemIdToDelete,
                },
            });
    
            return {
                status: "Success",
                message: "Item deleted successfully",
            };
        },
    };`
}

function generateUpdateContent(name) {
    const functionName = `update${name}`;
    const method = 'PUT';

    return `// @ts-nocheck
    import { db } from "#src/core/database/index.mjs"
    import { bodySchema } from "./${functionName}.schema.mjs"
    import { validateToken } from "#src/core/server/middleware/validateToken.mjs"
    import { requestMeta } from "#src/core/helpers/requestMeta.mjs"
    import { validateUser } from '#src/app/routes/validateUser.mjs';
    
    /** @type {import("fastify").RouteOptions} */
    export const ${functionName} = {
        url: "/broncoLogistics/${name}/:id",
        method: ${method},
        schema: {
            body: bodySchema,
        },
        preValidation: [validateToken],
        handler: async (req) => {
    
            const body = /** @type {import("./${functionName}.schema.mjs").Body} */ (req.body)
    
            const itemIdToUpdate = req.params.id;
            const { userId } = requestMeta(req)
    
            await validateUser(userId, true);
    
            const checkDBQuery = await db.customerContractRates.findUnique({
                where: {
                    id: itemIdToUpdate,
                },
            });
    
            if (!checkDBQuery) return { status: "Error", message: "Item not found" };
    
            try {
                const dbQuery = await db.customerContractRates.update({
                    where: {
                        id: itemIdToUpdate,
                    },
                    data: body
                });
    
                return {
                    status: "Success",
                    data: dbQuery,
                };
    
            } catch (error) {
                return {
                    status: "Error",
                    message: "Failed to update Item",
                }
            }
        },
    }`;

}