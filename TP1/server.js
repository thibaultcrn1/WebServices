const soap = require("soap");
const fs = require("node:fs");
const http = require("http");
const postgres = require("postgres");

const sql = postgres({ db: "mydb", user: "user", password: "password" });

const service = {
  ProductsService: {
    ProductsPort: {
      CreateProduct: async function ({ name, about, price }, callback) {
        if (!name || !about || !price) {
          throw {
            Fault: {
              Code: {
                Value: "soap:Sender",
                Subcode: { value: "rpc:BadArguments" },
              },
              Reason: { Text: "Processing Error" },
              statusCode: 400,
            },
          };
        }

        const product = await sql`
          INSERT INTO products (name, about, price)
          VALUES (${name}, ${about}, ${price})
          RETURNING *
        `;

        callback(product[0]);
      },

      GetProducts: async function (_args, callback) {
        const products = await sql`SELECT * FROM products`;
        // La lib soap ne gère pas les tableaux natifs en RPC encoded,
        // on sérialise en JSON dans le champ "products"
        callback({ products: JSON.stringify(products) });
      },

      PatchProduct: async function ({ id, name, about, price }, callback) {
        if (!id) {
          throw {
            Fault: {
              Code: {
                Value: "soap:Sender",
                Subcode: { value: "rpc:BadArguments" },
              },
              Reason: { Text: "L'identifiant (id) est obligatoire" },
              statusCode: 400,
            },
          };
        }

        // Vérification que le produit existe
        const existing = await sql`SELECT * FROM products WHERE id = ${id}`;
        if (existing.length === 0) {
          throw {
            Fault: {
              Code: {
                Value: "soap:Sender",
                Subcode: { value: "rpc:NotFound" },
              },
              Reason: { Text: "Produit introuvable" },
              statusCode: 404,
            },
          };
        }

        // Mise à jour partielle : on ne remplace que les champs fournis
        const current = existing[0];
        const updated = await sql`
          UPDATE products
          SET
            name  = ${name  ?? current.name},
            about = ${about ?? current.about},
            price = ${price ?? current.price}
          WHERE id = ${id}
          RETURNING *
        `;

        callback(updated[0]);
      },

      DeleteProduct: async function ({ id }, callback) {
        if (!id) {
          throw {
            Fault: {
              Code: {
                Value: "soap:Sender",
                Subcode: { value: "rpc:BadArguments" },
              },
              Reason: { Text: "L'identifiant (id) est obligatoire" },
              statusCode: 400,
            },
          };
        }

        const deleted = await sql`
          DELETE FROM products
          WHERE id = ${id}
          RETURNING *
        `;

        if (deleted.length === 0) {
          throw {
            Fault: {
              Code: {
                Value: "soap:Sender",
                Subcode: { value: "rpc:NotFound" },
              },
              Reason: { Text: "Produit introuvable" },
              statusCode: 404,
            },
          };
        }

        callback(deleted[0]);
      },
    },
  },
};

const server = http.createServer(function (request, response) {
  response.end("404: Not Found: " + request.url);
});

server.listen(8000);

const xml = fs.readFileSync("productsService.wsdl", "utf8");
soap.listen(server, "/products", service, xml, function () {
  console.log("SOAP server running at http://localhost:8000/products?wsdl");
});
