use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use dotenvy::dotenv;
use std::env;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde::{Serialize,Deserialize};
use actix_cors::Cors;
//use argon2::{Argon2, PasswordHash, PasswordVerifier};

#[derive(sqlx::FromRow,Serialize, Deserialize)]
pub struct User{
    name: String,
    email: String,
    password: String,
    hours: u32,
    status: u32,
}
#[derive(sqlx::FromRow,Serialize, Deserialize)]
pub struct UserInfo{
    name: String,
    email: String,
    hours: u32,
    status: u32,
}

#[actix_web::get("/users/{id}")]
async fn get_user(db: web::Data<SqlitePool>,
    path: web::Path<String>,)->impl Responder{ 
    let id = path.into_inner();
    let result = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(id)
        .fetch_optional(db.get_ref())
        .await;

    match result {
        Ok(Some(user)) => HttpResponse::Ok().json(user),
        Ok(None) => HttpResponse::NotFound().body("User not found"),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

#[derive(Deserialize)]
pub struct LogUser{
    email: String,
    password: String,
}

#[actix_web::post("/login")]
async fn user_login(db: web::Data<SqlitePool>,
rec: web::Json<LogUser>)->impl Responder{
    let pwd_result = sqlx::query!("SELECT password FROM users WHERE email = ?", rec.email)
        .fetch_optional(db.get_ref())
        .await;
        match pwd_result {
            Ok(Some(record)) => {
                if record.password.as_deref() == Some(&rec.password){
                    let result = sqlx::query_as::<_, UserInfo>("SELECT * FROM users WHERE email = ?")
                    .bind((rec.email).clone())
                    .fetch_optional(db.get_ref())
                    .await;
                    match result{
                        Ok(Some(user)) => HttpResponse::Ok().json(user),
                        Ok(None) => HttpResponse::NotFound().body("User not found"),
                        Err(_) => HttpResponse::InternalServerError().finish(),
                    }
                    }
                else {
                    
                    HttpResponse::Unauthorized().body(format!("Invalid credentials"))
                }
            }
            Ok(None) => HttpResponse::Unauthorized().body("User not found"),
            Err(_) => HttpResponse::InternalServerError().body("Database error"),
        }
    }

#[derive(sqlx::FromRow,Serialize, Deserialize)]
pub struct Req{
    requester: String,
    verifier: String,
    name: String,
    hours: u32,
    description: String,
}

#[actix_web::post("/sendHours")]
async fn send_hours(db: web::Data<SqlitePool>,
info: web::Json<Req>)->impl Responder{
    let result = sqlx::query("INSERT INTO event (requester,verifier,name,hours,description ) VALUES (?, ?,?,?,?)")//adding to the database
        .bind((info.requester).clone())
        .bind((info.verifier).clone())
        .bind((info.name).clone())
        .bind((info.hours).clone())
        .bind((info.description).clone())
        .execute(db.get_ref())
        .await;
    let des = sqlx::query_as::<_, Req>("SELECT * FROM event WHERE verifier = ?")
        .bind((info.verifier).clone())
        .fetch_optional(db.get_ref())
        .await;
        match des{
            Ok(Some(event)) => HttpResponse::Ok().json(event),
            Ok(None) => HttpResponse::NotFound().body("User not found"),
           
        Err(e) => {
            eprintln!("Insert error: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[actix_web::put("/users/{id}/add/{hrs}")]
async fn change_hours(db: web::Data<SqlitePool>,
    path: web::Path<(String, u32)>,)->impl Responder{ 
    let (id, hrs) = path.into_inner();
    let update = sqlx::query("UPDATE users SET hours = hours + ? WHERE email = ?")
        .bind(hrs)
        .bind(&id)
        .execute(db.get_ref())
        .await;
    if let Err(e) = update {
        eprintln!("Failed to update hours: {:?}", e);
        return HttpResponse::InternalServerError().finish();
    }
    let result = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(&id)
        .fetch_optional(db.get_ref())
        .await;
    match result {
        Ok(Some(user)) => HttpResponse::Ok().json(user),
        Ok(None) => HttpResponse::NotFound().body("User not found"),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}


#[actix_web::get("/create/{id}")]
async fn create_user_name(
    user_data: web::Path<String>,
    db: web::Data<SqlitePool>,
) -> impl Responder{
    //this function creates a new user and gives them an auto-incremented user id
    let result = sqlx::query("INSERT INTO users (name,email) VALUES (?, ?)")//adding to the database
        .bind(user_data.clone())//user_data is {id}
        .bind("lorenzojmarck@gmail.com")
        .execute(db.get_ref())
        .await;
    match result { // the match control flow allows for the code to run a specific set of commands following the outcome of "result"
        Ok(res) => HttpResponse::Ok().body(format!("Created user with ID {}", res.last_insert_rowid())),
        Err(e) => {
            eprintln!("Insert error: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    //the main function sets up the server with the address 127.0.0.1 and port 8080
    let port = 8080;
    println!("Starting port on port {}", port);
    dotenv().ok();
    let db_url = env::var("DATABASE_URL").unwrap(); //accesses the database
    let pool = SqlitePoolOptions::new() //creates the connection pool that allows for resuable database connections
        .connect(&db_url)
        .await
        .expect("Failed to connect to DB");
    HttpServer::new(move||{
        
        let app_pool_data = web::Data::new(pool.clone());
        App::new().wrap(Cors::permissive()).app_data(app_pool_data).service(get_user).service(create_user_name).service(change_hours).service(user_login).service(send_hours)//states what functions we can use, order does not matter
    })
        .bind(("0.0.0.0", port))?
        .workers(2)
        .run()
        .await
}