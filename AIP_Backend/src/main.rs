use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use dotenvy::dotenv;
use std::env;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde::{Serialize,Deserialize};
use actix_cors::Cors;
//use argon2::{Argon2, PasswordHash, PasswordVerifier};

#[derive(sqlx::FromRow,Serialize, Deserialize)] // an object called User that contains all of the information of each user.
pub struct User{
    name: String,
    email: String,
    password: String,
    hours: u32,
    status: u32,
}

#[actix_web::get("/users/{id}")] //This API will get the user's information - mainly used for testing
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
#[derive(sqlx::FromRow,Serialize, Deserialize)]//an object that contains all of the information of a request. One thing 
//to notice is the ID because the ID is autoincrementented so it is not included in the created reuqest object.
pub struct ReqR{
    requester: String,
    verifier: String,
    name: String,
    hours: u32,
    description: String,
    id: u32,
}

#[actix_web::get("/requests/{id}")]
//this API gets all of the hours confirmation requests for a teacher/faculty
async fn get_requests(db: web::Data<SqlitePool>,
    path: web::Path<String>,)->impl Responder{ 
    let id = path.into_inner();
    let result = sqlx::query_as::<_, ReqR>("SELECT * FROM event WHERE verifier = ?")
        .bind(id)
        .fetch_all(db.get_ref())//gets a vector filled with all of the requests
        .await;

    match result {
        Ok(vec) => HttpResponse::Ok().json(vec),//outputs the information of the requests
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

#[actix_web::get("/remove/{id}")]
//this API gets all of the hours confirmation requests for a teacher/faculty
async fn remove(db: web::Data<SqlitePool>,
    path: web::Path<u32>,)->impl Responder{ 
    let id = path.into_inner();
    let result = sqlx::query("DELETE FROM event WHERE id = ?")
        .bind(id)
        .execute(db.get_ref())//gets a vector filled with all of the requests
        .await;

    match result {
        Ok(res) if res.rows_affected() > 0 => HttpResponse::Ok().body("User deleted"),
        Ok(_) => HttpResponse::NotFound().body("User not found"),//outputs the information of the requests
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}
#[actix_web::get("/email/{id}/status/{xd}")]
//this API gets all of the hours confirmation requests for a teacher/faculty
async fn change_status(db: web::Data<SqlitePool>,
    path: web::Path<(String,u32)>,)->impl Responder{ 
    let (id,xd) = path.into_inner();
    let update = sqlx::query("UPDATE users SET status =  ? WHERE email = ?")
        .bind(xd)
        .bind(&id)
        .execute(db.get_ref())
        .await;
    if let Err(e) = update {
        eprintln!("Failed to update status: {:?}", e);
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


#[derive(Deserialize)] // this object is used to match the input for a user log in
pub struct LogUser{
    email: String,
    password: String,
}



#[derive(sqlx::FromRow,Serialize, Deserialize)] // this object is used to return some but not all of the user's information - namely not including the password for security reasons
pub struct UserInfo{
    name: String,
    email: String,
    hours: u32,
    status: u32,
}
#[actix_web::post("/login")] //this API is used for when the user logs in
//it takes in the LogUser information as an input, and if the information is correct
//it will return the corresponding user information
async fn user_login(db: web::Data<SqlitePool>,
rec: web::Json<LogUser>)->impl Responder{
    let pwd_result = sqlx::query!("SELECT password FROM users WHERE email = ?", rec.email)
        .fetch_optional(db.get_ref())
        .await;
        match pwd_result {
            Ok(Some(record)) => {
                if record.password == rec.password{
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
//This object is used when a request is being created, it doesn't
// include the ID because it is autoincrementing
pub struct Req{
    requester: String,
    verifier: String,
    name: String,
    hours: u32,
    description: String,
}

#[actix_web::post("/sendHours")]
//takes data corresponding to the Req object as an input,
//returns the faculty that the reccomendation is being sent to because it has to make sure that person exists
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
//this API is used to update hours, taking in the users email and the number of hours as an input
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


#[actix_web::get("/create/{id}/email/{ed}/password/{pwd}")] // used to create a user - mainly for testing
async fn create_user_name(
    user_data: web::Path<(String, String, String)>,
    db: web::Data<SqlitePool>,
) -> impl Responder{
    let (id, email,pwd) = user_data.into_inner();
    //this function creates a new user and gives them an auto-incremented user id
    let result = sqlx::query("INSERT INTO users (name,email,password) VALUES (?, ?, ?)")//adding to the database
        .bind(id)//user_data is {id}
        .bind(email)
        .bind(pwd)
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
    //the main function sets up the server with the address localhost and port 8080
    let port = 8080;
    println!("Starting port on port {}", port);
    dotenv().ok();
    let db_url = env::var("DATABASE_URL").unwrap(); //accesses the database
    let pool = SqlitePoolOptions::new() //creates the connection pool that allows for resuable database connections
        .connect(&db_url)
        .await
        .expect("Failed to connect to DB");
    HttpServer::new(move||{
        
        let app_pool_data = web::Data::new(pool.clone()); //lets the APIs use the database information
        App::new().wrap(Cors::permissive()).app_data(app_pool_data).service(get_user)
        .service(create_user_name).service(change_hours).service(user_login)
        .service(send_hours).service(get_requests).service(change_status).service(remove)
        //states what functions we can use, order does not matter
        //starts the app and allows for the API functionality <-- basically connects everything together
    })
        .bind(("localhost", port))? //binds the address and port
        .workers(2)
        .run()
        .await
}